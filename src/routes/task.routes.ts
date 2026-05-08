import { Router } from "express";
import { TaskController } from "@/controllers/task.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { CreateTaskSchema, UpdateTaskStatusSchema, LinkTaskSchema } from "@/validations/task.validation";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

// Routes for tasks
router.get("/", authenticate(), asyncHandler(TaskController.getAllByCity));
router.post("/", authenticate(), validate(CreateTaskSchema), asyncHandler(TaskController.create));
router.patch("/:id/status", authenticate(), validate(UpdateTaskStatusSchema), asyncHandler(TaskController.updateStatus));
router.patch("/:id/assign", authenticate(), asyncHandler(TaskController.assignWorker));
router.patch("/:id/link", authenticate(), validate(LinkTaskSchema), asyncHandler(TaskController.linkToIncident));

export default router;
