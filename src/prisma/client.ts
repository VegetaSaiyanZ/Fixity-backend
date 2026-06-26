import { EnvHandler } from "@/handlers/env.handler";
import { PrismaClient } from "@prisma/client";

// Added prisma to the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (EnvHandler.instance.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
