import prisma from "@/prisma/client";
import { AuthUtils } from "@/utils/auth.utils";
import {
  SignupDTO,
  SigninDTO,
  RefreshDTO,
  SignoutDTO,
} from "@/validations/auth.validation";
import { CustomError } from "@/middleware/error.middleware";
import { UserRole } from "@prisma/client";

export class AuthService {
  static async signup(data: SignupDTO) {
    const { firstName, lastName, email, password, cityId } = data;

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new CustomError("Email already exists", 409);
    }

    const hashedPassword = await AuthUtils.hashPassword(password);

    const city = await prisma.city.findUnique({
      where: { cityId: cityId },
    });

    if (!city) {
      throw new CustomError("City not found", 400);
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        role: UserRole.Citizen,
        cityId,
      },
    });

    const { token, refreshToken } = AuthUtils.generateTokens({
      userId: user.userId.toString(),
    });

    await prisma.refreshToken.create({
      data: { userId: user.userId, refreshToken },
    });

    return { token, refreshToken, user };
  }

  static async signin(data: SigninDTO) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new CustomError("Invalid credentials", 401);
    }

    const isPasswordValid = await AuthUtils.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new CustomError("Invalid credentials", 401);
    }

    const { token, refreshToken } = AuthUtils.generateTokens({
      userId: user.userId.toString(),
    });

    await prisma.refreshToken.create({
      data: { userId: user.userId, refreshToken },
    });

    return { token, refreshToken, user };
  }

  static async refresh(data: RefreshDTO) {
    const { refreshToken } = data;

    let decoded;
    try {
      decoded = AuthUtils.verifyToken(refreshToken);
    } catch (error) {
      throw new CustomError("Invalid refresh token", 401);
    }

    const userId = Number(decoded.userId);

    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new CustomError("User not found", 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { refreshToken },
    });

    if (!storedToken) {
      throw new CustomError("Invalid or revoked refresh token", 401);
    }

    const { token, refreshToken: newRefreshToken } = AuthUtils.generateTokens({
      userId: storedToken.userId.toString(),
    });

    await prisma.refreshToken.update({
      where: { refreshTokenId: storedToken.refreshTokenId },
      data: { refreshToken: newRefreshToken },
    });

    return { token, refreshToken: newRefreshToken };
  }

  static async signout(data: SignoutDTO) {
    const { refreshToken } = data;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { refreshToken },
    });

    if (storedToken) {
      await prisma.refreshToken.delete({
        where: { refreshTokenId: storedToken.refreshTokenId },
      });
    }

    return { message: "User signed out" };
  }
}
