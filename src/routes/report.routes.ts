import { Router } from "express";
import { uploadReportImage } from "../middleware/uploadMiddleware";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Routes for reports
router.get("/", authenticate(), ReportController.getAll);
router.get("/:id", authenticate(), ReportController.getById);

// Upload image and get AI analysis draft
router.post(
  "/upload-analyze",
  authenticate(),
  uploadReportImage.single("image"),
  ReportController.uploadAndAnalyze,
);

// Create report after user confirms draft
router.post("/", authenticate(), ReportController.create);

// Update/Delete reports
router.patch("/:id", authenticate(), ReportController.update);
router.delete("/:id", authenticate(), ReportController.delete);

export default router;
