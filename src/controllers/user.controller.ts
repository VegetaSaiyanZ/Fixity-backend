import { Response } from "express";
import { AuthRequest } from "@/middleware/auth.middleware";
import { UserService } from "@/services/user.service";
import { CustomError } from "@/middleware/error.middleware";

export class UserController {
  static async getMe(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new CustomError("Unauthorized", 401);
    }

    const user = await UserService.getMe(userId);
    res.status(200).json(user);
  }

  static async updateMe(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new CustomError("Unauthorized", 401);
    }

    const updatedUser = await UserService.updateMe(userId, req.body);
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  }

  static async uploadAvatar(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new CustomError("Unauthorized", 401);
    }

    if (!req.file) {
      throw new CustomError("No avatar image uploaded", 400);
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await UserService.updateMe(userId, { profilePictureUrl });

    res.status(200).json({
      message: "Avatar uploaded successfully",
      user: updatedUser,
    });
  }
}
