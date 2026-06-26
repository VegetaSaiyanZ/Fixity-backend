import { Request, Response, NextFunction } from "express";

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error Middleware:", err);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Handle Prisma Known Errors if needed
  if (err.code && typeof err.code === "string" && err.code.startsWith("P2")) {
    return res.status(400).json({ error: "Database operation failed", details: err.message });
  }

  res.status(500).json({ error: "Internal server error" });
};
