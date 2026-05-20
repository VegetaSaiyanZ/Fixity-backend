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
        profilePictureUrl: true,
        createdAt: true,
        city: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    const { city, ...userWithoutCity } = user;
    return {
      ...userWithoutCity,
      cityName: city?.name || null,
    };
  }

  static async updateMe(userId: number, data: UpdateUserDTO) {
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail && existingEmail.userId !== userId) {
        throw new CustomError("Email already in use", 409);
      }
    }

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
        profilePictureUrl: true,
        createdAt: true,
        city: {
          select: {
            name: true,
          },
        },
      },
    });

    const { city, ...userWithoutCity } = updatedUser;
    return {
      ...userWithoutCity,
      cityName: city?.name || null,
    };
  }
}
