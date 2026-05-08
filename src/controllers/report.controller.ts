import { Request, Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { ReportService } from "@/services/report.service";
import { CustomError } from "@/middleware/error.middleware";

export class ReportController {
  static async uploadAndAnalyze(req: Request, res: Response) {
    if (!req.file) {
      throw new CustomError("No image uploaded", 400);
    }

    const result = await ReportService.uploadAndAnalyze(req.file);

    res.status(200).json({
      message: "Image uploaded and analyzed successfully",
      ...result,
    });
  }

  static async getAllOfUserCity(req: AuthRequest, res: Response) {
    const userId = req.user!.userId;
    const userCityId = req.user!.cityId;
    if (!userCityId) throw new CustomError("Pick a city", 400);
    const reports = await ReportService.getAllOfUserCity(userId, userCityId);
    res.status(200).json(reports);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (isNaN(id)) throw new CustomError("Invalid report ID", 400);

    const report = await ReportService.getById(id);
    res.status(200).json(report);
  }

  static async create(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    const userCityId = req.user!.cityId;

    if (!userId) throw new CustomError("Unauthorized", 401);
    if (!userCityId)
      throw new CustomError("Pick a city before creating a report", 400);
    const newReport = await ReportService.create(userId, req.body, userCityId);
    res
      .status(201)
      .json({ message: "Report created successfully", report: newReport });
  }

  static async update(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    const userCityId = req.user!.cityId;

    if (isNaN(id)) throw new CustomError("Invalid report ID", 400);

    const userId = req.user?.userId;
    const userRole = req.user?.role;
    if (!userId || !userRole) throw new CustomError("Unauthorized", 401);

    const updatedReport = await ReportService.update(id, req.body, userCityId);
    res.status(200).json({
      message: "Report updated successfully",
      report: updatedReport,
    });
  }

  static async delete(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new CustomError("Invalid report ID", 400);

    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const userCityId = req.user!.cityId;
    if (!userId || !userRole) throw new CustomError("Unauthorized", 401);

    const result = await ReportService.delete(id, userId, userRole, userCityId);
    res.status(200).json(result);
  }
}
