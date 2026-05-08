import { Router } from "express";
import reportRoutes from "./report.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const router = Router();

// Register all routes
router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);

export default router;
