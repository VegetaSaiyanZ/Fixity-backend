import { Request, Response, NextFunction } from "express";
import { AuthUtils } from "../utils/auth.utils";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export type AuthRequest = Request & {
  user?: { userId: number; role: UserRole };
};

export const authenticate = (allowedRoles?: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = AuthUtils.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const tokenContent = AuthUtils.verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { userId: parseInt(tokenContent.userId) },
        select: { userId: true, role: true },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      req.user = { userId: user.userId, role: user.role };
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
