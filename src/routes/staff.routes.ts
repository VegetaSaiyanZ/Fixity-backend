import { Router } from "express";
import { StaffController } from "@/controllers/staff.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { ListStaffSchema, CreateStaffSchema } from "@/validations/staff.validation";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/", authenticate([UserRole.Official, UserRole.Manager, UserRole.HR]), validate(ListStaffSchema), asyncHandler(StaffController.listStaff));
router.post("/", authenticate([UserRole.HR]), validate(CreateStaffSchema), asyncHandler(StaffController.createStaff));
router.delete("/:userId", authenticate([UserRole.HR]), asyncHandler(StaffController.deleteStaff));

export default router;
