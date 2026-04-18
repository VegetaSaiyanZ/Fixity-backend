import { PrismaClient } from './generated/prisma/client';

// add prisma to the NodeJS global type to prevent exhausting database connections
// in development

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  // @ts-ignore
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
