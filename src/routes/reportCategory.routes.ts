import { asyncHandler } from "@/utils/asyncHandler";
import { Router } from "express";
import { ReportCategoryController } from "@/controllers/reportCategory.controller";

const router = Router();

router.get("/", asyncHandler(ReportCategoryController.getAll));

export default router;
