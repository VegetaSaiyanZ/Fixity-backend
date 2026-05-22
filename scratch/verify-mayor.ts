import assert from "assert";

// 1. Setup mock dates
const now = new Date("2026-05-22T23:38:14.000Z");
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

// Mock database data
const mockCategories = [
  { reportCategoryId: 1, name: "Electrical" },
  { reportCategoryId: 2, name: "Pothole" },
];

const mockIncidents = [
  { incidentId: 1, resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), baseSeverity: 4 }, // resolved 2 days ago (current period)
  { incidentId: 2, resolvedAt: null, baseSeverity: 8 }, // Open, high severity (8)
  { incidentId: 3, resolvedAt: null, baseSeverity: 2 }, // Open, low severity (2)
  { incidentId: 4, resolvedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), baseSeverity: 5 }, // resolved 9 days ago (previous period)
];

const mockReports = [
  {
    reportId: 1,
    cityId: 1,
    description: "Flickering streetlight",
    status: "Open",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // created 3 days ago (age 3 days)
    latitude: 32.085,
    longitude: 34.781,
    supportCount: 2,
    categoryId: 1,
    requesterId: 101,
    requester: { firstName: "John", lastName: "Citizen" },
    incidentId: null,
    incident: null,
  },
  {
    reportId: 2,
    cityId: 1,
    description: "Large pothole in road",
    status: "Closed",
    createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // created 10 days ago, resolved 2 days ago
    latitude: 32.086,
    longitude: 34.782,
    supportCount: 1,
    categoryId: 2,
    requesterId: 101,
    requester: { firstName: "John", lastName: "Citizen" },
    incidentId: 1,
    incident: mockIncidents[0],
  },
  {
    reportId: 3,
    cityId: 1,
    description: "Sparking electric pole",
    status: "Open",
    createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // created 6 hours ago
    latitude: 32.0852, // very close to report 1 (for clustering)
    longitude: 34.7811,
    supportCount: 10, // high support count -> urgent
    categoryId: 1,
    requesterId: 102,
    requester: { firstName: "Jane", lastName: "Citizen" },
    incidentId: 2,
    incident: mockIncidents[1],
  },
  {
    reportId: 4,
    cityId: 1,
    description: "Minor crack in sidewalk",
    status: "Assigned",
    createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // created 8 days ago (exceeds SLA of 7 days)
    latitude: 32.095, // far away (other cluster)
    longitude: 34.795,
    supportCount: 1,
    categoryId: 2,
    requesterId: 102,
    requester: { firstName: "Jane", lastName: "Citizen" },
    incidentId: 3,
    incident: mockIncidents[2],
  },
  {
    reportId: 5,
    cityId: 1,
    description: "Pothole in sidewalk",
    status: "Closed",
    createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), // created 12 days ago, resolved 9 days ago
    latitude: 32.096,
    longitude: 34.796,
    supportCount: 1,
    categoryId: 2,
    requesterId: 102,
    requester: { firstName: "Jane", lastName: "Citizen" },
    incidentId: 4,
    incident: mockIncidents[3],
  },
];

// Mock Prisma client
const mockPrisma = {
  report: {
    count: async (args: any) => {
      const { cityId, status, createdAt, OR } = args.where;
      let count = 0;

      for (const r of mockReports) {
        if (r.cityId !== cityId) continue;
        if (status && status.not === "Closed" && r.status === "Closed") continue;
        if (createdAt && createdAt.lte && r.createdAt > createdAt.lte) continue;

        if (OR) {
          // Evaluating OR: status.not === "Closed" OR incident.resolvedAt > T
          const cond1 = r.status !== "Closed";
          const cond2 = r.incident && r.incident.resolvedAt && r.incident.resolvedAt > OR[1].incident.resolvedAt.gt;
          if (!cond1 && !cond2) continue;
        }

        count++;
      }
      return count;
    },
    findMany: async (args: any) => {
      const { cityId, status, createdAt, OR } = args.where || {};
      let result = mockReports.map(r => ({
        ...r,
        category: mockCategories.find(c => c.reportCategoryId === r.categoryId)!,
      }));

      // Filter
      result = result.filter(r => {
        if (cityId && r.cityId !== cityId) return false;
        if (status) {
          if (typeof status === "string" && r.status !== status) return false;
          if (status.not === "Closed" && r.status === "Closed") return false;
        }
        if (createdAt) {
          if (createdAt.lte && r.createdAt > createdAt.lte) return false;
          if (createdAt.gte && r.createdAt < createdAt.gte) return false;
        }
        if (args.where?.incident?.resolvedAt) {
          const resolvedAtFilter = args.where.incident.resolvedAt;
          const resDate = r.incident?.resolvedAt;
          if (!resDate) return false;
          if (resolvedAtFilter.gte && resDate < resolvedAtFilter.gte) return false;
          if (resolvedAtFilter.lte && resDate > resolvedAtFilter.lte) return false;
          if (resolvedAtFilter.lt && resDate >= resolvedAtFilter.lt) return false;
        }
        if (OR) {
          const cond1 = r.status !== "Closed";
          const cond2 = r.incident && r.incident.resolvedAt && r.incident.resolvedAt >= OR[1].incident.resolvedAt.gte;
          if (!cond1 && !cond2) return false;
        }
        return true;
      });

      return result;
    },
  },
  reportCategory: {
    findMany: async (args: any) => {
      // Returns categories with reports nested
      return mockCategories.map(cat => ({
        ...cat,
        reports: mockReports.filter(r => r.categoryId === cat.reportCategoryId && r.cityId === 1 && r.status !== "Closed"),
      }));
    },
  },
};

// 2. Register mock prisma in global scope before importing services
(global as any).prisma = mockPrisma;

// 3. Mock AI Service to prevent actual API calls
import { AiService } from "../src/services/ai.service";
AiService.generateMayorInsights = async (statsText: string) => {
  return {
    insight: "Mocked AI Insight: Detected high safety hazard concentrations in electrical systems.",
    action_type: "RESOLVE_URGENT",
  };
};

// 4. Import MayorService
import { MayorService } from "../src/services/mayor.service";

async function testStats() {
  console.log("Testing stats endpoint...");
  const stats = await MayorService.getStats(1);
  console.log("Stats result:", JSON.stringify(stats, null, 2));

  // Assert calculations:
  // Current open: report 1, report 3, report 4 (3 reports)
  assert.strictEqual(stats.openReports.value, 3);
  
  // Open 7 days ago:
  // - Report 1 (created 3 days ago): Not open 7 days ago.
  // - Report 2 (created 10 days ago, resolved 2 days ago): open 7 days ago.
  // - Report 3 (created 6h ago): Not open 7 days ago.
  // - Report 4 (created 8 days ago): Not open 7 days ago.
  // - Report 5 (created 12 days ago, resolved 9 days ago): resolved 9 days ago, which is before 7 days ago, so not open 7 days ago.
  // So reports open 7 days ago: Report 2, Report 4. Total = 2.
  // Current open reports = 3.
  // Delta = ((3 - 2) / 2) * 100 = +50%.
  assert.strictEqual(stats.openReports.delta, "+50.0%");

  // Current resolution time (last 7 days):
  // - Report 2 resolved 2 days ago. resTime = 10 days - 2 days = 8 days.
  // Avg current resolution time = 8 days.
  assert.strictEqual(stats.resolutionTime.value, 8.0);

  // Previous resolution time (7 to 14 days ago):
  // - Report 5 resolved 9 days ago. resTime = 12 days - 9 days = 3 days.
  // Avg previous resolution time = 3 days.
  assert.strictEqual(stats.resolutionTime.delta, "+5.0d");

  // Satisfaction calculations:
  // Report satisfaction score formula in current active:
  // - Report 1 (Open, age 3 days): score = 70 (since age <= 5)
  // - Report 2 (Closed, resTime 8 days): score = 65 (since resTime <= 10)
  // - Report 3 (Open, age 0.25 days): score = 85 (since age <= 2)
  // - Report 4 (Open, age 8 days): score = 55 (since age <= 10)
  // Avg current satisfaction = (70 + 65 + 85 + 55) / 4 = 68.75 -> 68.8%
  assert.strictEqual(stats.satisfaction.value, 68.8);

  console.log("Stats endpoint test passed!\n");
}

async function testAiInsights() {
  console.log("Testing AI insights endpoint...");
  const insights = await MayorService.getAiInsights(1);
  console.log("AI Insights result:", JSON.stringify(insights, null, 2));
  assert.strictEqual(insights.action_type, "RESOLVE_URGENT");
  console.log("AI insights endpoint test passed!\n");
}

async function testCriticalAlerts() {
  console.log("Testing critical alerts endpoint...");
  const alerts = await MayorService.getCriticalAlerts(1);
  console.log("Critical alerts result:", JSON.stringify(alerts, null, 2));

  // Active reports: 1, 3, 4
  // - Report 1 (Open, age 3 days, severity null):
  //   - supportCount = 2 (not >= 5)
  //   - severity = null (not >= 7)
  //   - SLA days = 5. Age = 3 days. Exceeded SLA? No (3 <= 5).
  //   - Is urgent? No. Exceeded SLA? No.
  //   - Result: Not in alerts.
  // - Report 3 (Open, age 0.25 days, severity 8):
  //   - supportCount = 10 (>= 5 -> urgent)
  //   - severity = 8 (>= 7 -> urgent)
  //   - SLA days = 1. Age = 0.25 days. Exceeded SLA? No.
  //   - Is urgent? Yes.
  //   - Result: In alerts.
  // - Report 4 (Assigned, age 8 days, severity 2):
  //   - supportCount = 1 (not >= 5)
  //   - severity = 2 (not >= 7)
  //   - SLA days = 7. Age = 8 days. Exceeded SLA? Yes (8 > 7).
  //   - Is urgent? No. Exceeded SLA? Yes.
  //   - Result: In alerts.
  // Expected alerts: Report 3, Report 4.
  assert.strictEqual(alerts.length, 2);
  const ids = alerts.map(a => a.reportId);
  assert.ok(ids.includes(3));
  assert.ok(ids.includes(4));

  console.log("Critical alerts endpoint test passed!\n");
}

async function testMapDensity() {
  console.log("Testing map density/clustering endpoint...");
  const density = await MayorService.getMapDensity(1);
  console.log("Map density result:", JSON.stringify(density, null, 2));

  // Active reports coordinates:
  // - Report 1: 32.085, 34.781 (severity 3 since incident is null)
  // - Report 3: 32.0852, 34.7811 (severity 8 since incident is mockIncidents[1])
  // - Report 4: 32.095, 34.795 (severity 2 since incident is mockIncidents[2])
  // Clustering:
  // - Report 1 and Report 3 are within distance 0.003 (Euclidean dist = sqrt(0.0002^2 + 0.0001^2) = 0.000223 < 0.003). So they cluster!
  //   - Centroid = ((32.085 + 32.0852)/2, (34.781 + 34.7811)/2) = (32.0851, 34.78105)
  //   - Density = 2.
  //   - Severity score sum = 3 + 8 = 11. Avg severity = 5.5 (Medium).
  // - Report 4 is far away, so it forms its own cluster.
  //   - Centroid = (32.095, 34.795)
  //   - Density = 1.
  //   - Severity score sum = 2. Avg severity = 2 (Low).
  // Expected clusters: 2.
  assert.strictEqual(density.length, 2);
  
  const cluster1 = density.find(d => d.density === 2);
  assert.ok(cluster1);
  assert.strictEqual(cluster1.severity, "Medium");

  const cluster2 = density.find(d => d.density === 1);
  assert.ok(cluster2);
  assert.strictEqual(cluster2.severity, "Low");

  console.log("Map density/clustering endpoint test passed!\n");
}

async function runAll() {
  try {
    await testStats();
    await testAiInsights();
    await testCriticalAlerts();
    await testMapDensity();
    console.log("ALL TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test verification failed!", err);
    process.exit(1);
  }
}

runAll();
