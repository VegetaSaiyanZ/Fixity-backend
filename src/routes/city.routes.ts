import { CityController } from "@/controllers/city.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import { validate } from "@/middleware/validate.middleware";
import { GetCitiesSchema } from "@/validations/city.validation";
import { Router } from "express";

const router = Router();

router.get("/", validate(GetCitiesSchema), asyncHandler(CityController.getAll));

export default router;
