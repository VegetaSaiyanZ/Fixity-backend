import prisma from "@/prisma/client";
import {
  CreateReportDTO,
  UpdateReportDTO,
} from "@/validations/report.validation";
import { CustomError } from "@/middleware/error.middleware";
import { AiService } from "@/services/ai.service";
import fs from "fs";
import { ReportStatus, UserRole } from "@prisma/client";

export class ReportService {
  static async uploadAndAnalyze(
    file: Express.Multer.File,
    skipAi: boolean = false,
    analyzeOnly: boolean = false,
  ) {
    const imageUrl = `/uploads/${file.filename}`;
    const filePath = file.path;

    if (skipAi) {
      return { imageUrl, aiDraft: null };
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = file.mimetype;

    let aiDraft = null;
    try {
      aiDraft = await AiService.analyzeImage(fileBuffer, mimeType);
    } finally {
      if (analyzeOnly) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error("Failed to delete temp file:", error);
        }
      }
    }

    if (analyzeOnly) {
      return { imageUrl: null, aiDraft };
    }

    return { imageUrl, aiDraft };
  }

  static async getActiveOfUserCity(userId: number, userCityId: number) {
    return await prisma.report.findMany({
      where: {
        cityId: userCityId,
        status: {
          not: ReportStatus.Closed,
        },
      },
      include: {
        category: true,
        requester: {
          select: { firstName: true, lastName: true, cityId: true },
        },
        supports: true,
      },
    });
  }

  static async getByUser(userId: number) {
    return await prisma.report.findMany({
      where: {
        requesterId: userId,
      },
      include: {
        category: true,
        supports: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getById(id: number) {
    const report = await prisma.report.findUnique({
      where: { reportId: id },
      include: {
        category: true,
        requester: {
          select: { firstName: true, lastName: true, cityId: true },
        },
        supports: true,
      },
    });

    if (!report) {
      throw new CustomError("Report not found", 404);
    }

    return report;
  }

  static async create(
    userId: number,
    data: CreateReportDTO,
    userCityId: number,
  ) {
    const newReport = await prisma.report.create({
      data: {
        requesterId: userId,
        categoryId: data.categoryId,
        cityId: userCityId,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        beforeImageUrl: data.beforeImageUrl,
      },
    });

    return newReport;
  }

  static async update(id: number, data: UpdateReportDTO, userCityId: number) {
    const report = await prisma.report.findUnique({
      where: { reportId: id },
      select: { requesterId: true, cityId: true },
    });

    if (!report) {
      throw new CustomError("Report not found", 404);
    }

    if (report.cityId !== userCityId) {
      throw new CustomError("You can only update reports from your city", 403);
    }

    const updatedReport = await prisma.report.update({
      where: { reportId: id },
      data: data as any,
    });

    return updatedReport;
  }

  static async delete(
    id: number,
    userId: number,
    userRole: UserRole,
    userCityId: number | null,
  ) {
    const report = await prisma.report.findUnique({
      where: { reportId: id },
      select: { requesterId: true, cityId: true, status: true },
    });

    if (!report) {
      throw new CustomError("Report not found", 404);
    }

    if (report.status !== ReportStatus.Open) {
      throw new CustomError("You can only delete open reports", 403);
    }

    if (userRole !== UserRole.Manager) {
      if (report.requesterId !== userId) {
        throw new CustomError("You can only delete your own reports", 403);
      }
    }

    if (report.cityId !== userCityId) {
      throw new CustomError("You can only delete reports from your city", 403);
    }

    await prisma.$transaction(async (tx) => {
      // Delete associated supports first to prevent foreign key constraint violation
      await tx.reportSupport.deleteMany({
        where: { reportId: id },
      });

      // Now delete the report
      await tx.report.delete({
        where: { reportId: id },
      });
    });

    return { message: "Report deleted successfully" };
  }

  static async supportReport(userId: number, reportId: number) {
    // 1. Get report to check requester
    const report = await prisma.report.findUnique({
      where: { reportId },
      select: { requesterId: true, incidentId: true },
    });

    if (!report) throw new CustomError("Report not found", 404);
    if (report.requesterId === userId) {
      throw new CustomError("You cannot support your own report", 400);
    }

    // 2. Check if already supported
    const existingSupport = await prisma.reportSupport.findUnique({
      where: {
        reportId_userId: { reportId, userId },
      },
    });

    return await prisma.$transaction(async (tx) => {
      if (existingSupport) {
        // UN-SUPPORT
        await tx.reportSupport.delete({
          where: { reportId_userId: { reportId, userId } },
        });

        const updatedReport = await tx.report.update({
          where: { reportId },
          data: { supportCount: { decrement: 1 } },
        });

        if (updatedReport.incidentId) {
          await tx.incident.update({
            where: { incidentId: updatedReport.incidentId },
            data: { priorityScore: { decrement: 5 } },
          });
        }

        return {
          message: "Support removed",
          supported: false,
          supportCount: updatedReport.supportCount,
        };
      } else {
        // SUPPORT
        await tx.reportSupport.create({
          data: { reportId, userId },
        });

        const updatedReport = await tx.report.update({
          where: { reportId },
          data: { supportCount: { increment: 1 } },
        });

        if (updatedReport.incidentId) {
          await tx.incident.update({
            where: { incidentId: updatedReport.incidentId },
            data: { priorityScore: { increment: 5 } },
          });
        }

        return {
          message: "Support added",
          supported: true,
          supportCount: updatedReport.supportCount,
        };
      }
    });
  }
}
