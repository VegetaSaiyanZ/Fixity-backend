import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { validate } from "@/middleware/validate.middleware";
import { SignupSchema, SigninSchema, RefreshSchema, SignoutSchema } from "@/validations/auth.validation";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.post("/signup", validate(SignupSchema), asyncHandler(AuthController.signup));
router.post("/signin", validate(SigninSchema), asyncHandler(AuthController.signin));
router.post("/refresh", validate(RefreshSchema), asyncHandler(AuthController.refresh));
router.post("/signout", validate(SignoutSchema), asyncHandler(AuthController.signout));

export default router;
