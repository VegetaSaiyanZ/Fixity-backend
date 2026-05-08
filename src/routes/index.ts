import { Router } from "express";
import reportRoutes from "@/routes/report.routes";
import authRoutes from "@/routes/auth.routes";
import userRoutes from "@/routes/user.routes";
import taskRoutes from "@/routes/task.routes";

const router = Router();

// Register all routes
router.use("/reports", reportRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/tasks", taskRoutes);

export default router;
