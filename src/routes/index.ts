import { Router } from "express";
import reportRoutes from "@/routes/report.routes";
import authRoutes from "@/routes/auth.routes";
import userRoutes from "@/routes/user.routes";
import reportCategoriesRoutes from "@/routes/reportCategory.routes";
import taskRoutes from "@/routes/task.routes";
import cityRoutes from "./city.routes";
import incidentRoutes from "@/routes/incident.routes";
import categoryRoutes from "@/routes/category.routes";
import mayorRoutes from "@/routes/mayor.routes";

const router = Router();

// Register all routes
router.use("/reports", reportRoutes);
router.use("/report-categories", reportCategoriesRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/cities", cityRoutes);
router.use("/incidents", incidentRoutes);
router.use("/categories", categoryRoutes);
router.use("/mayor", mayorRoutes);

export default router;
