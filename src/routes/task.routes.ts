import { Router } from "express";
import { TaskController } from "@/controllers/task.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { uploadReportImage } from "@/middleware/uploadMiddleware";
import { CreateTaskSchema, UpdateTaskStatusSchema, LinkTaskSchema } from "@/validations/task.validation";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Routes for tasks
router.get("/", authenticate(["Worker", "Manager", "Official"]), asyncHandler(TaskController.getAllByCity));
router.post("/", authenticate(["Manager", "Official"]), validate(CreateTaskSchema), asyncHandler(TaskController.create));
router.patch("/:id/status", authenticate(["Worker", "Manager"]), validate(UpdateTaskStatusSchema), asyncHandler(TaskController.updateStatus));
router.patch("/:id/assign", authenticate(["Worker"]), asyncHandler(TaskController.assignWorker));
router.patch("/:id/link", authenticate(["Manager", "Official"]), validate(LinkTaskSchema), asyncHandler(TaskController.linkToIncident));
router.patch("/:id/image", authenticate(["Worker"]), uploadReportImage.single("image"), asyncHandler(TaskController.uploadImage));

export default router;
