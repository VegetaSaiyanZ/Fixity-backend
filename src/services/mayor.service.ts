import prisma from "@/prisma/client";
import { AiService } from "@/services/ai.service";

import {
  getSlaDays,
  getReportSatisfactionScore,
  formatPercentDelta,
  averageResolutionTime,
  haversineDistance,
  MS_PER_DAY,
  SEVEN_DAYS_MS,
  FOURTEEN_DAYS_MS,
  DIST_THRESHOLD_KM,
  ReportWithIncident,
} from '@/utils/mayorUtils';

// Internal type for clustering geo-points
interface GeoCluster {
  lat: number;
  lng: number;
  density: number;
  severityScoreSum: number;
  points: { lat: number; lng: number; severity: number }[];
}

export class MayorService {



  static async getStats(cityId: number) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
    const fourteenDaysAgo = new Date(now.getTime() - FOURTEEN_DAYS_MS);

    // 1. Total Open Reports (current vs. 7 days ago snapshot)
    const currentOpenReports = await prisma.report.count({
      where: {
        cityId,
        status: { not: "Closed" },
      },
    });

    const openReportsSevenDaysAgo = await prisma.report.count({
      where: {
        cityId,
        createdAt: { lte: sevenDaysAgo },
        OR: [
          { status: { not: "Closed" } },
          {
            incident: {
              resolvedAt: { gt: sevenDaysAgo }
            }
          }
        ]
      }
    });

    const openReportsDeltaStr = formatPercentDelta(currentOpenReports, openReportsSevenDaysAgo);

    // 2. Total Closed Reports (current vs. previous 7-day window)
    const currentClosedReports = await prisma.report.count({
      where: {
        cityId,
        status: "Closed",
      },
    });

    // Count reports that were closed in the 7-14 day window (previous period)
    const previousClosedReports = await prisma.report.count({
      where: {
        cityId,
        status: "Closed",
        incident: {
          resolvedAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      },
    });

    // Count reports closed in the last 7 days (current period) for delta calculation
    const recentClosedReports = await prisma.report.count({
      where: {
        cityId,
        status: "Closed",
        incident: {
          resolvedAt: {
            gte: sevenDaysAgo,
            lte: now,
          },
        },
      },
    });

    const closedReportsDeltaStr = formatPercentDelta(recentClosedReports, previousClosedReports);

    // 2. Average Resolution Time
    const currentResolvedReports = await prisma.report.findMany({
      where: {
        cityId,
        status: "Closed",
        incident: {
          resolvedAt: {
            gte: sevenDaysAgo,
            lte: now,
          },
        },
      },
      include: {
        incident: {
          select: { resolvedAt: true }
        }
      }
    });

    const previousResolvedReports = await prisma.report.findMany({
      where: {
        cityId,
        status: "Closed",
        incident: {
          resolvedAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      },
      include: {
        incident: {
          select: { resolvedAt: true }
        }
      }
    });



    const currentAvgResTime = averageResolutionTime(currentResolvedReports);
    const previousAvgResTime = averageResolutionTime(previousResolvedReports);
    const resTimeDelta = currentAvgResTime - previousAvgResTime;
    const resTimeDeltaStr = (resTimeDelta >= 0 ? "+" : "") + resTimeDelta.toFixed(1) + "d";

    // 3. Satisfaction Percentage
    const currentActiveReports = await prisma.report.findMany({
      where: {
        cityId,
        createdAt: { lte: now },
        OR: [
          { status: { not: "Closed" } },
          {
            incident: {
              resolvedAt: { gte: sevenDaysAgo }
            }
          }
        ]
      },
      include: {
        incident: {
          select: { resolvedAt: true }
        }
      }
    });

    const previousActiveReports = await prisma.report.findMany({
      where: {
        cityId,
        createdAt: { lte: sevenDaysAgo },
        OR: [
          { status: { not: "Closed" } },
          {
            incident: {
              resolvedAt: { gte: fourteenDaysAgo }
            }
          }
        ]
      },
      include: {
        incident: {
          select: { resolvedAt: true }
        }
      }
    });

    const calculateSatisfaction = (reports: ReportWithIncident[], referenceDate: Date): number => {
      if (reports.length === 0) return 85.0; // default satisfaction when no data
      const sum = reports.reduce((acc, r) => {
        return acc + getReportSatisfactionScore(
          r.createdAt,
          r.incident?.resolvedAt ?? null,
          (r as any).status,
          referenceDate,
        );
      }, 0);
      return sum / reports.length;
    };

    const currentSatisfaction = calculateSatisfaction(currentActiveReports, now);
    const previousSatisfaction = calculateSatisfaction(previousActiveReports, sevenDaysAgo);
    const satisfactionDelta = currentSatisfaction - previousSatisfaction;
    const satisfactionDeltaStr = (satisfactionDelta >= 0 ? "+" : "") + satisfactionDelta.toFixed(1) + "%";

    return {
      openReports: {
        value: currentOpenReports,
        delta: openReportsDeltaStr,
      },
      closedReports: {
        value: currentClosedReports,
        delta: closedReportsDeltaStr,
      },
      resolutionTime: {
        value: Number(currentAvgResTime.toFixed(1)),
        delta: resTimeDeltaStr,
      },
      satisfaction: {
        value: Number(currentSatisfaction.toFixed(1)),
        delta: satisfactionDeltaStr,
      }
    };
  }

  static async getAiInsights(cityId: number) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
    const fourteenDaysAgo = new Date(now.getTime() - FOURTEEN_DAYS_MS);

    // Fetch total active reports count
    const currentOpenReports = await prisma.report.count({
      where: {
        cityId,
        status: { not: "Closed" },
      },
    });

    // Fetch reports grouped by categories
    const categories = await prisma.reportCategory.findMany({
      include: {
        reports: {
          where: {
            cityId,
            status: { not: "Closed" },
          }
        }
      }
    });

    // Fetch recent spikes in last 7 days vs previous 7 days
    const recentReports = await prisma.report.findMany({
      where: {
        cityId,
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        category: true,
      }
    });

    const previousReports = await prisma.report.findMany({
      where: {
        cityId,
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
      include: {
        category: true,
      }
    });

    // Count recent and previous reports by category name
    const recentCounts: Record<string, number> = {};
    const previousCounts: Record<string, number> = {};

    recentReports.forEach(r => {
      const name = r.category.name;
      recentCounts[name] = (recentCounts[name] || 0) + 1;
    });

    previousReports.forEach(r => {
      const name = r.category.name;
      previousCounts[name] = (previousCounts[name] || 0) + 1;
    });

    const categorySummary = categories.map(cat => {
      const active = cat.reports.length;
      const recent = recentCounts[cat.name] || 0;
      const previous = previousCounts[cat.name] || 0;
      return `- ${cat.name}: ${active} active reports (${recent} created in last 7 days, compared to ${previous} in previous 7 days)`;
    }).join("\n");

    const statsText = `
Total Open/Assigned Reports: ${currentOpenReports}
Active Reports by Category:
${categorySummary}
Recent Reports created (Last 7 days): ${recentReports.length}
Previous Reports created (7-14 days ago): ${previousReports.length}
`;

    const aiResult = await AiService.generateMayorInsights(statsText);
    return aiResult;
  }

  static async getCriticalAlerts(cityId: number) {
    const now = new Date();

    const activeReports = await prisma.report.findMany({
      where: {
        cityId,
        status: { not: "Closed" },
      },
      include: {
        category: true,
        incident: true,
        requester: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const alerts = activeReports.map(report => {
      const createdAt = report.createdAt;
      const ageDays = (now.getTime() - createdAt.getTime()) / MS_PER_DAY;
      const severity = report.incident?.baseSeverity ?? null;
      const slaDays = getSlaDays(severity);
      const isUrgent = (severity !== null && severity >= 7) || (report.supportCount !== null && report.supportCount >= 5);
      const exceededSla = ageDays > slaDays;

      return {
        reportId: report.reportId,
        description: report.description,
        createdAt,
        status: report.status,
        supportCount: report.supportCount ?? 1,
        category: report.category.name,
        severity,
        slaDays,
        ageDays: Number(ageDays.toFixed(1)),
        isUrgent,
        exceededSla,
        requesterName: `${report.requester.firstName} ${report.requester.lastName}`,
      };
    });

    // Filter to return only those marked as urgent or exceeding SLA
    return alerts.filter(a => a.isUrgent || a.exceededSla);
  }

  static async getMapDensity(cityId: number) {
    const reports = await prisma.report.findMany({
      where: {
        cityId,
        status: { not: "Closed" },
      },
      include: {
        incident: { select: { baseSeverity: true } },
      },
    });

    const clusters: GeoCluster[] = [];

    for (const report of reports) {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);

      // Skip reports with missing or invalid coordinates
      if (isNaN(lat) || isNaN(lng)) continue;

      const severity = report.incident?.baseSeverity ?? 3;

      let addedToCluster = false;
      for (const cluster of clusters) {
        const dist = haversineDistance(lat, lng, cluster.lat, cluster.lng);
        if (dist < DIST_THRESHOLD_KM) {
          cluster.points.push({ lat, lng, severity });
          cluster.lat = cluster.points.reduce((sum, p) => sum + p.lat, 0) / cluster.points.length;
          cluster.lng = cluster.points.reduce((sum, p) => sum + p.lng, 0) / cluster.points.length;
          cluster.density = cluster.points.length;
          cluster.severityScoreSum += severity;
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          lat,
          lng,
          density: 1,
          severityScoreSum: severity,
          points: [{ lat, lng, severity }],
        });
      }
    }

    return clusters.map(c => {
      const avgSeverity = c.severityScoreSum / c.density;
      let severityLevel: "Low" | "Medium" | "High" | "Critical";
      if (avgSeverity < 3) severityLevel = "Low";
      else if (avgSeverity < 6) severityLevel = "Medium";
      else if (avgSeverity < 8) severityLevel = "High";
      else severityLevel = "Critical";

      return {
        lat: Number(c.lat.toFixed(6)),
        lng: Number(c.lng.toFixed(6)),
        density: c.density,
        severity: severityLevel,
      };
    });
  }
}
