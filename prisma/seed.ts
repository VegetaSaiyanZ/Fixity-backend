import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reportCategoryNames = [
    "Electrical",
    "Plumbing",
    "Safety Hazard",
    "Garbage Collection",
    "Graffiti",
    "Pothole",
    "Streetlight",
    "Other",
  ];

  for (const name of reportCategoryNames) {
    await prisma.reportCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

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
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, type: cat.type },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
