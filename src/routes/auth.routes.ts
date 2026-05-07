import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/refresh", AuthController.refresh);
router.post("/signin", AuthController.signin);
router.post("/signup", AuthController.signup);
router.post("/signout", AuthController.signout);

export default router;
