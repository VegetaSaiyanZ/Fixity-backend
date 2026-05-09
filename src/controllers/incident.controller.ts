import { Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { IncidentService } from "@/services/incident.service";

export class IncidentController {
  static async getAllByCity(req: AuthRequest, res: Response) {
    const userCityId = req.user!.cityId;
    const incidents = await IncidentService.getAllByCity(userCityId);
    res.status(200).json(incidents);
  }

  static async create(req: AuthRequest, res: Response) {
    const userCityId = req.user!.cityId;
    const newIncident = await IncidentService.create(req.body, userCityId);
    res
      .status(201)
      .json({
        message: "Incident created successfully",
        incident: newIncident,
      });
  }

  static async update(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    const userCityId = req.user!.cityId;
    const updated = await IncidentService.update(id, userCityId, req.body);
    res
      .status(200)
      .json({ message: "Incident updated successfully", incident: updated });
  }

  static async delete(req: AuthRequest, res: Response) {
    const id = Number(req.params.id);
    const userCityId = req.user!.cityId;
    const result = await IncidentService.delete(id, userCityId);
    res.status(200).json(result);
  }
}
