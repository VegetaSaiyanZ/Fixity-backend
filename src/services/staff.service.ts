import prisma from "@/prisma/client";
import { AuthUtils } from "@/utils/auth.utils";
import { CustomError } from "@/middleware/error.middleware";
import { UserRole } from "@prisma/client";
import { CreateStaffDTO } from "@/validations/staff.validation";

export class StaffService {
  static async listStaff(cityId: number, role: UserRole) {
    return await prisma.user.findMany({
      where: {
        cityId,
        role,
        deletedAt: null,
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
  }

  static async createStaff(creatorRole: UserRole, cityId: number, data: CreateStaffDTO) {
    const { firstName, lastName, email, role } = data;

    if ((role as UserRole) === UserRole.Official || (role as UserRole) === UserRole.Manager) {
      throw new CustomError(
        "Cannot create accounts with the Official or Manager role",
        403,
      );
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

    return await prisma.user.create({
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
  }

  static async deleteStaff(callerUserId: number, creatorRole: UserRole, cityId: number, targetId: number) {
    if (targetId === callerUserId) {
      throw new CustomError("You cannot delete your own account", 403);
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { userId: targetId },
    });

    if (!targetUser || targetUser.deletedAt !== null || targetUser.cityId !== cityId) {
      throw new CustomError("Staff member not found", 404);
    }

    // Permission checks
    if (targetUser.role === UserRole.Official) {
      throw new CustomError("Cannot delete an Official account", 403);
    }
    if (
      creatorRole === UserRole.Manager &&
      targetUser.role !== UserRole.Worker
    ) {
      throw new CustomError("Managers can only delete Worker accounts", 403);
    }

    // Use a transaction to unassign active tasks and soft delete user
    await prisma.$transaction(async (tx) => {
      // Unassign Active Tasks: Find tasks where assignedWorkerId is the target user and status is NOT 'Closed'
      await tx.task.updateMany({
        where: {
          assignedWorkerId: targetId,
          status: { not: "Closed" },
        },
        data: {
          assignedWorkerId: null,
          status: "Open"
        },
      });

      // Soft Delete User
      await tx.user.update({
        where: { userId: targetId },
        data: {
          deletedAt: new Date(),
        },
      });
    });
  }
}
