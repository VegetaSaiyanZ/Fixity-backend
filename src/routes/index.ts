import { Router } from "express";
import reportRoutes from "./report.routes";
import authRoutes from "./auth.routes";

const router = Router();

// Register all routes
router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);

export default router;
