import prisma from "@/prisma/client";
import { UpdateUserDTO } from "@/validations/user.validation";
import { CustomError } from "@/middleware/error.middleware";

export class UserService {
  static async getMe(userId: number) {
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
      throw new CustomError("User not found", 404);
    }

    return user;
  }

  static async updateMe(userId: number, data: UpdateUserDTO) {
    const updatedUser = await prisma.user.update({
      where: { userId },
      data,
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

    return updatedUser;
  }
}
