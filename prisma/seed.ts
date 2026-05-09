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
