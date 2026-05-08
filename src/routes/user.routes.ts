import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { UserController } from "@/controllers/user.controller";
import { validate } from "@/middleware/validate.middleware";
import { UpdateUserSchema } from "@/validations/user.validation";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.get("/me", authenticate(), asyncHandler(UserController.getMe));
router.patch("/me", authenticate(), validate(UpdateUserSchema), asyncHandler(UserController.updateMe));

export default router;
