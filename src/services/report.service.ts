import prisma from "@/prisma/client";
import { CreateReportDTO, UpdateReportDTO } from "@/validations/report.validation";
import { CustomError } from "@/middleware/error.middleware";
import { AiService } from "@/services/ai.service";
import fs from "fs";
import { UserRole } from "@prisma/client";

export class ReportService {
  static async uploadAndAnalyze(file: Express.Multer.File) {
    const imageUrl = `/uploads/${file.filename}`;
    const filePath = file.path;

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = file.mimetype;

    const aiDraft = await AiService.analyzeImage(fileBuffer, mimeType);

    return { imageUrl, aiDraft };
  }

  static async getAll() {
    return await prisma.report.findMany({
      include: {
        category: true,
        city: true,
        requester: {
          select: { firstName: true, lastName: true },
        },
      },
    });
  }

  static async getById(id: number) {
    const report = await prisma.report.findUnique({
      where: { reportId: id },
      include: {
        category: true,
        city: true,
        requester: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!report) {
      throw new CustomError("Report not found", 404);
    }

    return report;
  }

  static async create(userId: number, data: CreateReportDTO) {
    const requesterId = data.requesterId || userId;

    const newReport = await prisma.report.create({
      data: {
        requesterId,
        categoryId: data.categoryId,
        cityId: data.cityId,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        beforeImageUrl: data.beforeImageUrl,
      },
    });

    return newReport;
  }

  static async update(id: number, userId: number, userRole: UserRole, data: UpdateReportDTO) {
    const report = await prisma.report.findUnique({
      where: { reportId: id },
      select: { requesterId: true },
    });

    if (!report) {
      throw new CustomError("Report not found", 404);
    }

    if (userRole === UserRole.Citizen && report.requesterId !== userId) {
      throw new CustomError("You can only update your own reports", 403);
    }

    const updatedReport = await prisma.report.update({
      where: { reportId: id },
      data: data as any,
    });

    return updatedReport;
  }

  static async delete(id: number, userId: number, userRole: UserRole) {
    const report = await prisma.report.findUnique({
      where: { reportId: id },
      select: { requesterId: true },
    });

    if (!report) {
      throw new CustomError("Report not found", 404);
    }

    if (userRole === UserRole.Citizen && report.requesterId !== userId) {
      throw new CustomError("You can only delete your own reports", 403);
    }

    await prisma.report.delete({
      where: { reportId: id },
    });

    return { message: "Report deleted successfully" };
  }
}
