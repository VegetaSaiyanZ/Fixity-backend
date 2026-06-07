import { Router } from "express";
import { StaffController } from "@/controllers/staff.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { ListStaffSchema, CreateStaffSchema } from "@/validations/staff.validation";

const router = Router();

router.get("/", authenticate(["Official", "Manager"]), validate(ListStaffSchema), asyncHandler(StaffController.listStaff));
router.post("/", authenticate(["Official", "Manager"]), validate(CreateStaffSchema), asyncHandler(StaffController.createStaff));

export default router;
