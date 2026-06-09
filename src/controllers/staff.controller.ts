import { Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import prisma from "@/prisma/client";
import { AuthUtils } from "@/utils/auth.utils";
import { CustomError } from "@/middleware/error.middleware";
import { UserRole } from "@prisma/client";
import { CreateStaffDTO } from "@/validations/staff.validation";

export class StaffController {
  static async listStaff(req: AuthRequest, res: Response) {
    const cityId = req.user?.cityId;
    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }

    const { role } = req.query as { role: UserRole };

    const staff = await prisma.user.findMany({
      where: {
        cityId,
        role,
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePictureUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(staff);
  }

  static async createStaff(req: AuthRequest, res: Response) {
    const creatorRole = req.user?.role;
    const cityId = req.user?.cityId;

    if (!cityId) {
      throw new CustomError("User does not have an assigned city", 400);
    }

    const { firstName, lastName, email, role } = req.body as CreateStaffDTO;

    if ((role as UserRole) === UserRole.Official) {
      throw new CustomError(
        "Cannot create accounts with the Official role",
        403,
      );
    }
    if (creatorRole === UserRole.Manager && role !== UserRole.Worker) {
      throw new CustomError("Managers can only create Worker accounts", 403);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new CustomError("Email already in use", 409);
    }

    // Hash default password
    const hashedPassword = await AuthUtils.hashPassword("password123");

    const newStaff = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        role,
        cityId,
      },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profilePictureUrl: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "Staff account created successfully",
      user: newStaff,
    });
  }
}
