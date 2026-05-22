import prisma from "@/prisma/client";
import { AiService } from "@/services/ai.service";

function getSlaDays(baseSeverity: number | null | undefined): number {
  if (baseSeverity === null || baseSeverity === undefined) return 5;
  if (baseSeverity >= 7) return 1;
  if (baseSeverity >= 4) return 3;
  return 7;
}

function getReportSatisfactionScore(
  createdAt: Date,
  resolvedAt: Date | null,
  status: string,
  now: Date
): number {
  if (status === "Closed" && resolvedAt) {
    const resTimeDays = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (resTimeDays <= 2) return 95;
    if (resTimeDays <= 5) return 80;
    if (resTimeDays <= 10) return 65;
    return 45;
  } else {
    const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays <= 2) return 85;
    if (ageDays <= 5) return 70;
    if (ageDays <= 10) return 55;
    return 30;
  }
}

function formatPercentDelta(current: number, previous: number): string {
  if (previous === 0) {
    if (current === 0) return "+0%";
    return `+${(current * 100).toFixed(0)}%`;
  }
  const pct = ((current - previous) / previous) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

export class MayorService {
  static async getStats(cityId: number) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Total Open Reports
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

    const getAverageResolutionTime = (reports: any[]): number => {
      if (reports.length === 0) return 0;
      const sum = reports.reduce((acc, r) => {
        const resolvedAt = r.incident?.resolvedAt;
        if (!resolvedAt) return acc;
        const diff = resolvedAt.getTime() - r.createdAt.getTime();
        return acc + diff;
      }, 0);
      return sum / reports.length / (1000 * 60 * 60 * 24); // in days
    };

    const currentAvgResTime = getAverageResolutionTime(currentResolvedReports);
    const previousAvgResTime = getAverageResolutionTime(previousResolvedReports);
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

    const calculateSatisfaction = (reports: any[], referenceDate: Date): number => {
      if (reports.length === 0) return 85.0; // default satisfaction
      const sum = reports.reduce((acc, r) => {
        return acc + getReportSatisfactionScore(r.createdAt, r.incident?.resolvedAt, r.status, referenceDate);
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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

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
      const ageDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
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
        incident: true,
      },
    });

    interface Cluster {
      lat: number;
      lng: number;
      density: number;
      severityScoreSum: number;
      reports: { lat: number; lng: number; severity: number }[];
    }

    const clusters: Cluster[] = [];
    const distThreshold = 0.003; // ~300 meters

    for (const report of reports) {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      const severity = report.incident?.baseSeverity ?? 3;

      let addedToCluster = false;
      for (const cluster of clusters) {
        const dist = Math.sqrt(Math.pow(lat - cluster.lat, 2) + Math.pow(lng - cluster.lng, 2));
        if (dist < distThreshold) {
          cluster.reports.push({ lat, lng, severity });
          cluster.lat = cluster.reports.reduce((sum, r) => sum + r.lat, 0) / cluster.reports.length;
          cluster.lng = cluster.reports.reduce((sum, r) => sum + r.lng, 0) / cluster.reports.length;
          cluster.density = cluster.reports.length;
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
          reports: [{ lat, lng, severity }],
        });
      }
    }

    return clusters.map(c => {
      const avgSeverity = c.severityScoreSum / c.density;
      let severityLevel: "Low" | "Medium" | "High" | "Critical" = "Medium";
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
