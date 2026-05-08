import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    "Electrical",
    "Plumbing",
    "Safety Hazard",
    "Garbage Collection",
    "Graffiti",
    "Pothole",
    "Streetlight",
    "Other",
  ];

  for (const name of categories) {
    await prisma.reportCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Report categories seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
