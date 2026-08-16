import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import routes from "@/routes";
import { errorHandler } from "@/middleware/error.middleware";
import prisma from "@/prisma/client";

const app: Application = express();

const initApp = (): Promise<Application> => {
  return new Promise<Application>(async (resolve, reject) => {
    try {
      // Middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(
        cors({
          origin: (origin, callback) => callback(null, true),
          methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
          credentials: true,
        })
      );
      app.use(
        helmet({
          crossOriginResourcePolicy: { policy: "cross-origin" },
          contentSecurityPolicy: {
            directives: {
              ...helmet.contentSecurityPolicy.getDefaultDirectives(),
              "img-src": [
                "'self'",
                "data:",
                "https://*.tile.openstreetmap.org",
                "https://placehold.co",
              ],

              "connect-src": ["'self'", "https://nominatim.openstreetmap.org"],
            },
          },
        })
      );
      app.use(morgan("dev"));

      // Static path for uploads
      app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

      // Routes
      app.use("/api", routes);

      // serves static files from client
      const clientPath = path.join(
        process.cwd(),
        "..",
        "Fixity-frontend",
        "dist"
      );
      app.use(express.static(clientPath));

      // Base route
      app.get("/", (req: Request, res: Response) => {
        res
          .status(200)
          .json({ message: "Welcome to the Express Backend API!" });
      });

      // 404 Handler
      app.use((req: Request, res: Response, next: NextFunction) => {
        res.status(404).json({ error: "Endpoint not found" });
      });

      // Global Error Handler
      app.use(errorHandler);

      // Explicitly connect to the database to ensure connection is ready before resolving
      await prisma.$connect();
      console.log("Connection to db successful");

      resolve(app);
    } catch (error) {
      console.error(
        "Failed to connect to the database or initialize app:",
        error
      );
      reject(error);
    }
  });
};

export default initApp;
