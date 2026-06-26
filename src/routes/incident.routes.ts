import { Router } from "express";
import { IncidentController } from "@/controllers/incident.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { CreateIncidentSchema } from "@/validations/incident.validation";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Routes for incidents
router.get("/", authenticate(["Manager", "Official", "Worker"]), asyncHandler(IncidentController.getAllByCity));
router.post("/", authenticate(["Manager", "Official"]), validate(CreateIncidentSchema), asyncHandler(IncidentController.create));
router.patch("/:id", authenticate(["Manager", "Official"]), asyncHandler(IncidentController.update));
router.delete("/:id", authenticate(["Manager", "Official"]), asyncHandler(IncidentController.delete));

router.post("/:id/reports", authenticate(["Manager", "Official"]), asyncHandler(IncidentController.addReports));
router.delete("/:id/reports/:reportId", authenticate(["Manager", "Official"]), asyncHandler(IncidentController.removeReport));

export default router;
