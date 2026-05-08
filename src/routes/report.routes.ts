import { Router } from "express";
import { uploadReportImage } from "@/middleware/uploadMiddleware";
import { ReportController } from "@/controllers/report.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { CreateReportSchema, UpdateReportSchema } from "@/validations/report.validation";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Routes for reports
router.get("/", authenticate(), asyncHandler(ReportController.getAll));
router.get("/:id", authenticate(), asyncHandler(ReportController.getById));

// Upload image and get AI analysis draft
router.post(
  "/upload-analyze",
  authenticate(),
  uploadReportImage.single("image"),
  asyncHandler(ReportController.uploadAndAnalyze)
);

// Create report after user confirms draft
router.post("/", authenticate(), validate(CreateReportSchema), asyncHandler(ReportController.create));

// Update/Delete reports
router.patch("/:id", authenticate(), validate(UpdateReportSchema), asyncHandler(ReportController.update));
router.delete("/:id", authenticate(), asyncHandler(ReportController.delete));

export default router;
