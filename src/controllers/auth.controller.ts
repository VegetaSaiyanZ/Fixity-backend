import { Request, Response } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";

const prisma = new PrismaClient();

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }

      const hashedPassword = await AuthUtils.hashPassword(password);

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: hashedPassword,
          role: UserRole.Citizen,
        },
      });

      const { token, refreshToken } = AuthUtils.generateTokens({
        userId: user.userId.toString(),
      });

      await prisma.refreshToken.create({
        data: { userId: user.userId, refreshToken },
      });

      return res.status(201).json({
        message: "User signed up",
        token,
        refreshToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          cityId: user.cityId,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async signin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await AuthUtils.comparePassword(
        password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { token, refreshToken } = AuthUtils.generateTokens({
        userId: user.userId.toString(),
      });

      await prisma.refreshToken.create({
        data: { userId: user.userId, refreshToken },
      });

      return res.json({
        message: "User signed in",
        token,
        refreshToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          cityId: user.cityId,
        },
      });
    } catch (error) {
      console.error("Signin error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const decoded = AuthUtils.verifyToken(refreshToken);
      const userId = Number(decoded.userId);

      const user = await prisma.user.findUnique({
        where: { userId },
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const storedToken = await prisma.refreshToken.findUnique({
        where: { refreshToken },
      });

      if (!storedToken) {
        return res
          .status(401)
          .json({ error: "Invalid or revoked refresh token" });
      }

      const { token, refreshToken: newRefreshToken } = AuthUtils.generateTokens(
        {
          userId: storedToken.userId.toString(),
        },
      );

      await prisma.refreshToken.update({
        where: { refreshTokenId: storedToken.refreshTokenId },
        data: { refreshToken: newRefreshToken },
      });

      return res.json({
        message: "Token refreshed",
        token,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error("Refresh error:", error);
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  }

  static async signout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const storedToken = await prisma.refreshToken.findUnique({
        where: { refreshToken },
      });

      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { refreshTokenId: storedToken.refreshTokenId },
        });
      }

      return res.json({ message: "User signed out" });
    } catch (error) {
      console.error("Signout error:", error);
      return res.status(401).json({ error: "Invalid refresh token" });
    }
  }
}
