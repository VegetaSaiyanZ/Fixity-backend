import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { UserController } from "../controllers/user.controller";

const router = Router();

router.get("/me", authenticate(), UserController.getMe);
router.patch("/me", authenticate(), UserController.updateMe);

export default router;
