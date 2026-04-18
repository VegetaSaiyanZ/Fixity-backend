import { prisma } from '../db';
import { Prisma } from '../generated/prisma/client';

export const createReport = async (data: Prisma.ReportCreateInput) => {
  return await prisma.report.create({
    data,
  });
};

export const getReports = async () => {
  return await prisma.report.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });
};

export const getReportById = async (report_id: number) => {
  return await prisma.report.findUnique({
    where: { report_id },
  });
};

export const updateReport = async (report_id: number, data: Prisma.ReportUpdateInput) => {
  return await prisma.report.update({
    where: { report_id },
    data,
  });
};

export const deleteReport = async (report_id: number) => {
  return await prisma.report.delete({
    where: { report_id },
  });
};

export const supportReport = async (report_id: number, user_id: number) => {
  return await prisma.$transaction(async (tx) => {
    // Check if support already exists to prevent duplicate increments
    const existing = await tx.reportSupport.findUnique({
      where: {
        report_id_user_id: { report_id, user_id }
      }
    });

    if (existing) return existing;

    const support = await tx.reportSupport.create({
      data: { report_id, user_id }
    });

    await tx.report.update({
      where: { report_id },
      data: { support_count: { increment: 1 } }
    });

    return support;
  });
};

export const unsupportReport = async (report_id: number, user_id: number) => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.reportSupport.findUnique({
      where: {
        report_id_user_id: { report_id, user_id }
      }
    });

    if (!existing) return null;

    const deleted = await tx.reportSupport.delete({
      where: {
        report_id_user_id: { report_id, user_id }
      }
    });

    await tx.report.update({
      where: { report_id },
      data: { support_count: { decrement: 1 } }
    });

    return deleted;
  });
};
