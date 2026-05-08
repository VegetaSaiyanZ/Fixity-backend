import { Request, Response } from "express";
import { AuthService } from "@/services/auth.service";

export class AuthController {
  static async signup(req: Request, res: Response) {
    const result = await AuthService.signup(req.body);
    res.status(201).json({
      message: "User signed up",
      ...result,
    });
  }

  static async signin(req: Request, res: Response) {
    const result = await AuthService.signin(req.body);
    res.json({
      message: "User signed in",
      ...result,
    });
  }

  static async refresh(req: Request, res: Response) {
    const result = await AuthService.refresh(req.body);
    res.json({
      message: "Token refreshed",
      ...result,
    });
  }

  static async signout(req: Request, res: Response) {
    const result = await AuthService.signout(req.body);
    res.json(result);
  }
}
