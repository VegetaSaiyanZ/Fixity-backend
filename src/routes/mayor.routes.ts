import { Router } from "express";
import { MayorController } from "@/controllers/mayor.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.get("/stats", authenticate(["Official"]), asyncHandler(MayorController.getStats));
router.get("/ai-insights", authenticate(["Official"]), asyncHandler(MayorController.getAiInsights));
router.get("/critical-alerts", authenticate(["Official"]), asyncHandler(MayorController.getCriticalAlerts));
router.get("/map-density", authenticate(["Official"]), asyncHandler(MayorController.getMapDensity));

export default router;
