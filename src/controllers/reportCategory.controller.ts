import { ReportCategoryService } from "@/services/reportCategories.service";
import { Request, Response } from "express";

export class ReportCategoryController {
  static async getAll(req: Request, res: Response) {
    const allReportCategories = await ReportCategoryService.getAll();
    return res.status(200).json({
      message: "Report categories fetched successfully",
      data: allReportCategories,
    });
  }
}
