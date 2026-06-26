import { Request, Response, NextFunction } from "express";

// This utility wraps asynchronous controller functions. It automatically catches any unhandled errors 
// (Promise rejections) and passes them to Express's `next()` function, eliminating the need for repetitive try/catch blocks.
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
