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
  const cities: { id: number; name: string }[] = [
    { id: 1, name: "Tel Aviv" },
    { id: 2, name: "Jerusalem" },
    { id: 3, name: "Haifa" },
    { id: 4, name: "Rishon LeZion" },
    { id: 5, name: "Petah Tikva" },
    { id: 6, name: "Ashdod" },
    { id: 7, name: "Netanya" },
    { id: 8, name: "Beer Sheva" },
    { id: 9, name: "Bnei Brak" },
    { id: 10, name: "Holon" },
    { id: 11, name: "Ramat Gan" },
    { id: 12, name: "Rehovot" },
    { id: 13, name: "Bat Yam" },
    { id: 14, name: "Ashkelon" },
    { id: 15, name: "Jaffa" },
    { id: 16, name: "Herzliya" },
    { id: 17, name: "Kfar Saba" },
    { id: 18, name: "Ra'anana" },
    { id: 19, name: "Hadera" },
    { id: 20, name: "Lod" },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { cityId: city.id },
      update: {},
      create: {
        cityId: city.id,
        name: city.name,
      },
    });
  }

  console.log("Seeding task categories...");
  const taskCategories = [
    { name: "Electrical Repair", type: "Task" },
    { name: "Plumbing Repair", type: "Task" },
    { name: "Road Repair", type: "Task" },
    { name: "Cleanup", type: "Task" },
    { name: "Inspection", type: "Task" },
    { name: "Streetlight Repair", type: "Task" },
    { name: "General Maintenance", type: "Task" },
  ] as const;

  for (const cat of taskCategories) {
    await prisma.category.create({
      data: { name: cat.name, type: cat.type as CategoryType },
    });
  }

  console.log("Seeding users...");
  const city = await prisma.city.findFirst({ where: { name: "Tel Aviv" } });
  if (!city) throw new Error("City not found");
  
  const passwordHash = await bcrypt.hash("password123", 10);

  const citizen = await prisma.user.create({
    data: { email: "citizen@fixity.com", firstName: "John", lastName: "Citizen", passwordHash, role: UserRole.Citizen, cityId: city.cityId },
  });

  const worker = await prisma.user.create({
    data: { email: "worker@fixity.com", firstName: "Bob", lastName: "Worker", passwordHash, role: UserRole.Worker, cityId: city.cityId },
  });

  const manager = await prisma.user.create({
    data: { email: "manager@fixity.com", firstName: "Alice", lastName: "Manager", passwordHash, role: UserRole.Manager, cityId: city.cityId },
  });

  console.log("Seeding reports and tasks...");
  const repCat = await prisma.reportCategory.findFirst();
  const taskCat = await prisma.category.findFirst();

  for (let i = 1; i <= 4; i++) {
    const isAssigned = i <= 2;
    const incident = await prisma.incident.create({
      data: {
        cityId: city.cityId,
        description: `Street issue ${i}`,
        latitude: 32.0853 + i * 0.001,
        longitude: 34.7818 + i * 0.001,
      },
    });

    await prisma.report.create({
      data: {
        requesterId: citizen.userId,
        categoryId: repCat!.reportCategoryId,
        cityId: city.cityId,
        description: `Citizen report ${i}`,
        latitude: incident.latitude,
        longitude: incident.longitude,
        incidentId: incident.incidentId,
        status: isAssigned ? ReportStatus.Assigned : ReportStatus.Open,
      },
    });

    await prisma.task.create({
      data: {
        incidentId: incident.incidentId,
        categoryId: taskCat!.categoryId,
        assignedWorkerId: isAssigned ? worker.userId : null,
        status: isAssigned ? ReportStatus.Assigned : ReportStatus.Open,
        workerNotes: isAssigned ? `Assigned to worker by manager` : null,
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
