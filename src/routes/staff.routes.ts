import { Router } from "express";
import { StaffController } from "@/controllers/staff.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { ListStaffSchema, CreateStaffSchema } from "@/validations/staff.validation";

const router = Router();

router.get("/", authenticate(["Official", "Manager", "HR"]), validate(ListStaffSchema), asyncHandler(StaffController.listStaff));
router.post("/", authenticate(["HR"]), validate(CreateStaffSchema), asyncHandler(StaffController.createStaff));
router.delete("/:userId", authenticate(["HR"]), asyncHandler(StaffController.deleteStaff));

export default router;
