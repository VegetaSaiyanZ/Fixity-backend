import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export const createReport = async (data: Prisma.ReportUncheckedCreateInput) => {
  return await prisma.report.create({
    data,
  });
};

export const getReports = async () => {
  return await prisma.report.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      category: true,
      city: true,
      requester: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
};

export const getReportById = async (reportId: number) => {
  return await prisma.report.findUnique({
    where: { reportId },
    include: {
      category: true,
      city: true,
      requester: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      supports: true
    }
  });
};

export const updateReport = async (reportId: number, data: Prisma.ReportUncheckedUpdateInput) => {
  return await prisma.report.update({
    where: { reportId },
    data,
  });
};

export const deleteReport = async (reportId: number) => {
  return await prisma.report.delete({
    where: { reportId },
  });
};

export const supportReport = async (reportId: number, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    // Check if support already exists
    const existing = await tx.reportSupport.findUnique({
      where: {
        reportId_userId: { reportId, userId }
      }
    });

    if (existing) return existing;

    const support = await tx.reportSupport.create({
      data: { reportId, userId }
    });

    await tx.report.update({
      where: { reportId },
      data: { supportCount: { increment: 1 } }
    });

    return support;
  });
};

export const unsupportReport = async (reportId: number, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.reportSupport.findUnique({
      where: {
        reportId_userId: { reportId, userId }
      }
    });

    if (!existing) return null;

    const deleted = await tx.reportSupport.delete({
      where: {
        reportId_userId: { reportId, userId }
      }
    });

    await tx.report.update({
      where: { reportId },
      data: { supportCount: { decrement: 1 } }
    });

    return deleted;
  });
};
