import { PrismaClient, User } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { log } from "console";

const prisma = new PrismaClient();

export class UserController {
  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          cityId: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }

  static async updateMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { firstName, lastName, cityId } = req.body;
      log("UpdateMe request body:", req.body);
      // Validate input
      const updateData: Partial<User> = {};

      if (firstName !== undefined) {
        if (typeof firstName !== "string" || firstName.trim().length === 0) {
          res.status(400).json({ error: "Invalid firstName" });
          return;
        }
        updateData.firstName = firstName;
      }

      if (lastName !== undefined) {
        if (typeof lastName !== "string" || lastName.trim().length === 0) {
          res.status(400).json({ error: "Invalid lastName" });
          return;
        }
        updateData.lastName = lastName;
      }

      if (cityId !== undefined) {
        if (cityId !== null && (typeof cityId !== "number" || cityId < 1)) {
          res.status(400).json({ error: "Invalid cityId" });
          return;
        }

        // Verify city exists if provided
        if (cityId !== null) {
          const city = await prisma.city.findUnique({
            where: { cityId },
          });

          if (!city) {
            res.status(400).json({ error: "City not found" });
            return;
          }
        }

        updateData.cityId = cityId;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { userId },
        data: updateData,
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          cityId: true,
          createdAt: true,
        },
      });

      res.status(200).json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
}
