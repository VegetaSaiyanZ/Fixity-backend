import { Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { CustomError } from "@/middleware/error.middleware";
import { UserRole } from "@prisma/client";
import { CreateStaffDTO } from "@/validations/staff.validation";
import { StaffService } from "@/services/staff.service";

export class StaffController {
  static async listStaff(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }

    const { role } = req.query as { role: UserRole };

    const staff = await StaffService.listStaff(cityId, role);

    res.status(200).json(staff);
  }

  static async createStaff(req: AuthRequest, res: Response) {
    const creatorRole = req.user?.role;
    const cityId = req.user?.cityId;

    if (!creatorRole || !cityId) {
      throw new CustomError("User does not have an assigned city or role", 400);
    }

    const body = req.body as CreateStaffDTO;

    const newStaff = await StaffService.createStaff(creatorRole, cityId, body);

    res.status(201).json({
      message: "Staff account created successfully",
      user: newStaff,
    });
  }

  static async deleteStaff(req: AuthRequest, res: Response) {
    const creatorRole = req.user?.role;
    const cityId = req.user?.cityId;
    const callerUserId = req.user?.userId;

    if (!creatorRole || !cityId || !callerUserId) {
      throw new CustomError("Unauthorized or missing credentials", 400);
    }

    const targetId = Number(req.params.userId);

    await StaffService.deleteStaff(callerUserId, creatorRole, cityId, targetId);

    res.status(200).json({ message: "Staff account deactivated and tasks unassigned." });
  }
}

