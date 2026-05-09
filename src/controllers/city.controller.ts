import { Request, Response } from "express";
import { CityService } from "@/services/city.service";

export class CityController {
  static async getAll(req: Request, res: Response) {
    const filter =
      typeof req.query.filter === "string"
        ? req.query.filter.trim()
        : undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const normalizedPage = Number.isNaN(page) || page < 1 ? 1 : page;
    const normalizedLimit =
      Number.isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100);

    const result = await CityService.getAll({
      filter,
      page: normalizedPage,
      limit: normalizedLimit,
    });

    return res.status(200).json(result);
  }
}
