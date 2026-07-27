import { PrismaClient, UserRole, ReportStatus, CategoryType, IncidentStatus, TaskStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.reportSupport.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.report.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();
  await prisma.city.deleteMany();
  await prisma.category.deleteMany();
  await prisma.reportCategory.deleteMany();

  console.log("Seeding report categories...");
  const reportCategoryNames = [
    "Electrical",
    "Plumbing",
    "Safety Hazard",
    "Garbage Collection",
    "Graffiti",
    "Pothole",
    "Streetlight",
    "Other",
    "Traffic Signals",
    "Park Maintenance",
    "Water Leakage",
    "Noise Complaint",
    "Abandoned Vehicle",
    "Animal Control",
    "Vandalism",
    "Tree Trimming"
  ];
  for (const name of reportCategoryNames) {
    await prisma.reportCategory.create({ data: { name } });
  }

  console.log("Seeding cities...");
  const cities = [
    { id: 1, name: "Tel Aviv" },
    { id: 2, name: "Jerusalem" },
    { id: 3, name: "Haifa" },
    { id: 4, name: "Rishon LeZion" },
    { id: 5, name: "Petah Tikva" },
    { id: 6, name: "Ashdod" },
    { id: 7, name: "Netanya" }
  ];
  for (const city of cities) {
    await prisma.city.upsert({
      where: { cityId: city.id },
      update: {},
      create: { cityId: city.id, name: city.name },
    });
  }

  console.log("Seeding task categories...");
  const taskCategories = [
    { name: "Electrical Repair", type: CategoryType.Task },
    { name: "Plumbing Repair", type: CategoryType.Task },
    { name: "Road Repair", type: CategoryType.Task },
    { name: "Cleanup", type: CategoryType.Task },
    { name: "Signal Tuning", type: CategoryType.Task },
    { name: "Landscape Maintenance", type: CategoryType.Task },
    { name: "Leak Fix", type: CategoryType.Task },
    { name: "Noise Investigation", type: CategoryType.Task },
    { name: "Towing", type: CategoryType.Task },
    { name: "Stray Control", type: CategoryType.Task },
    { name: "Surface Repaint", type: CategoryType.Task },
    { name: "Tree Trimming", type: CategoryType.Task }
  ];
  for (const cat of taskCategories) {
    await prisma.category.create({ data: cat });
  }

  console.log("Seeding users...");
  const telAviv = await prisma.city.findFirst({ where: { name: "Tel Aviv" } });
  const netanya = await prisma.city.findFirst({ where: { name: "Netanya" } });
  const passwordHash = await bcrypt.hash("123123", 10);

  // Citizens
  const citizenTA1 = await prisma.user.create({
    data: { email: "citizen@fixity.com", firstName: "John", lastName: "Citizen", passwordHash, role: UserRole.Citizen, cityId: telAviv!.cityId },
  });
  const citizenTA2 = await prisma.user.create({
    data: { email: "citizen2@fixity.com", firstName: "Jane", lastName: "Citizen", passwordHash, role: UserRole.Citizen, cityId: telAviv!.cityId },
  });
  const citizenNetanya1 = await prisma.user.create({
    data: { email: "citizen.netanya1@fixity.com", firstName: "Mark", lastName: "Gold", passwordHash, role: UserRole.Citizen, cityId: netanya!.cityId },
  });
  const citizenNetanya2 = await prisma.user.create({
    data: { email: "citizen.netanya2@fixity.com", firstName: "Lisa", lastName: "Silver", passwordHash, role: UserRole.Citizen, cityId: netanya!.cityId },
  });

  // Workers
  const workerTA1 = await prisma.user.create({
    data: { email: "worker@fixity.com", firstName: "Bob", lastName: "Worker", passwordHash, role: UserRole.Worker, cityId: telAviv!.cityId },
  });
  const workerTA2 = await prisma.user.create({
    data: { email: "worker2@fixity.com", firstName: "Bill", lastName: "Worker", passwordHash, role: UserRole.Worker, cityId: telAviv!.cityId },
  });
  const workerNetanya = await prisma.user.create({
    data: { email: "worker.netanya@fixity.com", firstName: "Betty", lastName: "Worker", passwordHash, role: UserRole.Worker, cityId: netanya!.cityId },
  });

  // Managers
  const managerTA = await prisma.user.create({
    data: { email: "manager@fixity.com", firstName: "Alice", lastName: "Manager", passwordHash, role: UserRole.Manager, cityId: telAviv!.cityId },
  });
  const managerNetanya = await prisma.user.create({
    data: { email: "manager.netanya@fixity.com", firstName: "Andrew", lastName: "Manager", passwordHash, role: UserRole.Manager, cityId: netanya!.cityId },
  });

  // Officials (Mayors)
  const mayorTA = await prisma.user.create({
    data: { email: "mayor@fixity.com", firstName: "Mayor", lastName: "TelAviv", passwordHash, role: UserRole.Official, cityId: telAviv!.cityId },
  });
  const mayorNetanya = await prisma.user.create({
    data: { email: "mayor.netanya@fixity.com", firstName: "Mayor", lastName: "Netanya", passwordHash, role: UserRole.Official, cityId: netanya!.cityId },
  });

  // HR
  await prisma.user.create({
    data: { email: "hr@fixity.com", firstName: "Sarah", lastName: "HR", passwordHash, role: UserRole.HR, cityId: telAviv!.cityId },
  });

  console.log("Seeding reports and incidents for Tel Aviv...");
  const taRepCats = await prisma.reportCategory.findMany();
  const taTaskCats = await prisma.category.findMany();

  // We will define a layout of incidents and reports to seed
  const taIncidentData = [
    { desc: "Major Water Main Burst", severity: 8, supports: 18, requester: citizenTA1.userId, catName: "Water Leakage", taskCatName: "Leak Fix", status: IncidentStatus.InProgress },
    { desc: "Broken Traffic Light - Central Junction", severity: 7, supports: 25, requester: citizenTA2.userId, catName: "Traffic Signals", taskCatName: "Signal Tuning", status: IncidentStatus.InProgress },
    { desc: "Pothole blocking bicycle lane", severity: 4, supports: 6, requester: citizenTA1.userId, catName: "Pothole", taskCatName: "Road Repair", status: IncidentStatus.Open },
    { desc: "Illegal Graffiti on historical wall", severity: 2, supports: 1, requester: citizenTA2.userId, catName: "Graffiti", taskCatName: "Cleanup", status: IncidentStatus.Closed },
    { desc: "Flickering street lamp", severity: 3, supports: 4, requester: citizenTA1.userId, catName: "Streetlight", taskCatName: "Electrical Repair", status: IncidentStatus.Open }
  ];

  for (let i = 0; i < taIncidentData.length; i++) {
    const data = taIncidentData[i];
    const isClosed = data.status === IncidentStatus.Closed;
    const isInProgress = data.status === IncidentStatus.InProgress;

    const initialPriority = (data.severity * 10) + (data.supports * 5);

    const incident = await prisma.incident.create({
      data: {
        cityId: telAviv!.cityId,
        description: data.desc,
        latitude: 32.0853 + i * 0.003,
        longitude: 34.7818 + i * 0.003,
        baseSeverity: data.severity,
        priorityScore: initialPriority,
        status: data.status,
        resolvedAt: isClosed ? new Date() : null,
      },
    });

    const repCat = taRepCats.find(c => c.name === data.catName) || taRepCats[0];

    const report = await prisma.report.create({
      data: {
        requesterId: data.requester,
        categoryId: repCat.reportCategoryId,
        cityId: telAviv!.cityId,
        description: `Citizen reported: ${data.desc}`,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incidentId: incident.incidentId,
        status: isClosed ? ReportStatus.Closed : (isInProgress ? ReportStatus.Assigned : ReportStatus.Open),
        supportCount: data.supports,
      },
    });

    // Add support records
    await prisma.reportSupport.create({
      data: { reportId: report.reportId, userId: managerTA.userId },
    });

    const taskCat = taTaskCats.find(c => c.name === data.taskCatName) || taTaskCats[0];

    await prisma.task.create({
      data: {
        incidentId: incident.incidentId,
        categoryId: taskCat.categoryId,
        assignedWorkerId: isInProgress ? workerTA1.userId : (isClosed ? workerTA2.userId : null),
        status: isClosed ? TaskStatus.Closed : (isInProgress ? TaskStatus.Assigned : TaskStatus.Open),
        workerNotes: isInProgress ? "Assigned worker, repair team on route." : (isClosed ? "Cleaned up and repaired successfully." : null),
        resolvedAt: isClosed ? new Date() : null,
      },
    });
  }

  console.log("Seeding reports and incidents for Netanya...");
  const netanyaIncidentData = [
    { desc: "Park sprinklers leaking heavily", severity: 5, supports: 10, requester: citizenNetanya1.userId, catName: "Park Maintenance", taskCatName: "Landscape Maintenance", status: IncidentStatus.InProgress },
    { desc: "Abandoned vehicle on pavement", severity: 4, supports: 12, requester: citizenNetanya2.userId, catName: "Abandoned Vehicle", taskCatName: "Towing", status: IncidentStatus.Open },
    { desc: "Exposed high-voltage wires on playground", severity: 9, supports: 32, requester: citizenNetanya1.userId, catName: "Safety Hazard", taskCatName: "Electrical Repair", status: IncidentStatus.InProgress }
  ];

  for (let i = 0; i < netanyaIncidentData.length; i++) {
    const data = netanyaIncidentData[i];
    const isClosed = (data.status as IncidentStatus) === IncidentStatus.Closed;
    const isInProgress = (data.status as IncidentStatus) === IncidentStatus.InProgress;

    const initialPriority = (data.severity * 10) + (data.supports * 5);

    const incident = await prisma.incident.create({
      data: {
        cityId: netanya!.cityId,
        description: data.desc,
        latitude: 32.3214 + i * 0.004,
        longitude: 34.8532 + i * 0.004,
        baseSeverity: data.severity,
        priorityScore: initialPriority,
        status: data.status,
        resolvedAt: isClosed ? new Date() : null,
      },
    });

    const repCat = taRepCats.find(c => c.name === data.catName) || taRepCats[0];

    const report = await prisma.report.create({
      data: {
        requesterId: data.requester,
        categoryId: repCat.reportCategoryId,
        cityId: netanya!.cityId,
        description: `Netanya resident report: ${data.desc}`,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incidentId: incident.incidentId,
        status: isClosed ? ReportStatus.Closed : (isInProgress ? ReportStatus.Assigned : ReportStatus.Open),
        supportCount: data.supports,
      },
    });

    // Add support record
    await prisma.reportSupport.create({
      data: { reportId: report.reportId, userId: managerNetanya.userId },
    });

    const taskCat = taTaskCats.find(c => c.name === data.taskCatName) || taTaskCats[0];

    await prisma.task.create({
      data: {
        incidentId: incident.incidentId,
        categoryId: taskCat.categoryId,
        assignedWorkerId: isInProgress ? workerNetanya.userId : null,
        status: isClosed ? TaskStatus.Closed : (isInProgress ? TaskStatus.Assigned : TaskStatus.Open),
        workerNotes: isInProgress ? "Assigned Betty to inspect immediately." : null,
        resolvedAt: isClosed ? new Date() : null,
      },
    });
  }

  console.log("Seeding completed successfully for seed.prod!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
