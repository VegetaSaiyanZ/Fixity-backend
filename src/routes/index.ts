import { Router } from "express";
import reportRoutes from "@/routes/report.routes";
import authRoutes from "@/routes/auth.routes";
import userRoutes from "@/routes/user.routes";
import reportCategoriesRoutes from "@/routes/reportCategory.routes";

const router = Router();

// Register all routes
router.use("/reports", reportRoutes);
router.use("/report-categories", reportCategoriesRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);

export default router;
