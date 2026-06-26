import { Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { MayorService } from "@/services/mayor.service";
import { CustomError } from "@/middleware/error.middleware";

export class MayorController {
  static async getStats(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const stats = await MayorService.getStats(cityId);
    res.status(200).json(stats);
  }

  static async getAiInsights(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const insights = await MayorService.getAiInsights(cityId);
    res.status(200).json(insights);
  }

  static async getCriticalAlerts(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const alerts = await MayorService.getCriticalAlerts(cityId);
    res.status(200).json(alerts);
  }

  static async getMapDensity(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const category = req.query.category as string | undefined;
    const density = await MayorService.getMapDensity(cityId, category);
    res.status(200).json(density);
  }

  static async getDepartments(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const departments = await MayorService.getDepartments(cityId);
    res.status(200).json(departments);
  }

  static async getPulse(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const pulse = await MayorService.getPulse(cityId);
    res.status(200).json(pulse);
  }

  static async getRecommendations(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }
    const recommendations = await MayorService.getRecommendations(cityId);
    res.status(200).json(recommendations);
  }
}
