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
