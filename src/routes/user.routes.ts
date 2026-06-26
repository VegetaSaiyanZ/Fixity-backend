import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { UserController } from "@/controllers/user.controller";
import { validate } from "@/middleware/validate.middleware";
import { UpdateUserSchema } from "@/validations/user.validation";
import { asyncHandler } from "@/utils/asyncHandler";
import { uploadProfileImage } from "@/middleware/uploadMiddleware";

const router = Router();

router.get("/me", authenticate(), asyncHandler(UserController.getMe));
router.patch("/me", authenticate(), validate(UpdateUserSchema), asyncHandler(UserController.updateMe));
router.post("/me/avatar", authenticate(), uploadProfileImage.single("avatar"), asyncHandler(UserController.uploadAvatar));

export default router;
