import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// This middleware executes Zod schemas against incoming request payloads (body, query, params). 
// If validation fails, it blocks the request and returns a 400 Bad Request with details.
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Validation Error for", req.originalUrl, ":", JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
