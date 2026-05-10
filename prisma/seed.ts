import { PrismaClient, UserRole, ReportStatus, CategoryType } from "@prisma/client";
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

  console.log("Seeding categories...");
  const reportCategoryNames = ["Electrical", "Plumbing", "Safety Hazard", "Garbage Collection", "Graffiti", "Pothole", "Streetlight", "Other"];
  for (const name of reportCategoryNames) {
    await prisma.reportCategory.create({ data: { name } });
  }

  console.log("Seeding cities...");
  const cities = [
    { id: 1, name: "Tel Aviv" },
    { id: 2, name: "Jerusalem" },
    { id: 3, name: "Haifa" },
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
  ];
  for (const cat of taskCategories) {
    await prisma.category.create({ data: cat });
  }

  console.log("Seeding users...");
  const city = await prisma.city.findFirst({ where: { name: "Tel Aviv" } });
  const passwordHash = await bcrypt.hash("password123", 10);

  const citizen = await prisma.user.create({
    data: { email: "citizen@fixity.com", firstName: "John", lastName: "Citizen", passwordHash, role: UserRole.Citizen, cityId: city!.cityId },
  });

  const citizen2 = await prisma.user.create({
    data: { email: "citizen2@fixity.com", firstName: "Jane", lastName: "Citizen", passwordHash, role: UserRole.Citizen, cityId: city!.cityId },
  });

  const worker = await prisma.user.create({
    data: { email: "worker@fixity.com", firstName: "Bob", lastName: "Worker", passwordHash, role: UserRole.Worker, cityId: city!.cityId },
  });

  const manager = await prisma.user.create({
    data: { email: "manager@fixity.com", firstName: "Alice", lastName: "Manager", passwordHash, role: UserRole.Manager, cityId: city!.cityId },
  });

  console.log("Seeding reports and prioritized incidents...");
  const repCat = await prisma.reportCategory.findFirst();
  const taskCat = await prisma.category.findFirst();

  const incidentData = [
    { desc: "Major Water Leak", severity: 8, supports: 15, requester: citizen.userId },
    { desc: "Small Graffiti", severity: 2, supports: 2, requester: citizen.userId },
    { desc: "Broken Streetlight", severity: 5, supports: 20, requester: citizen2.userId },
    { desc: "Dangerous Pothole", severity: 7, supports: 5, requester: citizen2.userId },
    { desc: "Overflowing Bin", severity: 4, supports: 10, requester: citizen2.userId },
  ];

  for (let i = 0; i < incidentData.length; i++) {
    const data = incidentData[i];
    const isAssigned = i === 0;

    const initialPriority = (data.severity * 10) + (data.supports * 5);

    const incident = await prisma.incident.create({
      data: {
        cityId: city!.cityId,
        description: data.desc,
        latitude: 32.0853 + i * 0.005,
        longitude: 34.7818 + i * 0.005,
        baseSeverity: data.severity,
        priorityScore: initialPriority,
      },
    });

    const report = await prisma.report.create({
      data: {
        requesterId: data.requester,
        categoryId: repCat!.reportCategoryId,
        cityId: city!.cityId,
        description: `Citizen reported: ${data.desc}`,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incidentId: incident.incidentId,
        status: isAssigned ? ReportStatus.Assigned : ReportStatus.Open,
        supportCount: data.supports,
      },
    });

    // Seed some fake supports so the "already supported" logic can be tested
    await prisma.reportSupport.create({
      data: { reportId: report.reportId, userId: manager.userId },
    });

    await prisma.task.create({
      data: {
        incidentId: incident.incidentId,
        categoryId: taskCat!.categoryId,
        assignedWorkerId: isAssigned ? worker.userId : null,
        status: isAssigned ? ReportStatus.Assigned : ReportStatus.Open,
        workerNotes: isAssigned ? "Priority high, assigned immediately" : null,
      },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
