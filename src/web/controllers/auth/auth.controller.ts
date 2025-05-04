import { NextFunction, Request, Response } from "express";
import AuthService from "../../../application/auth.service";

export default class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  resetPassword(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }
  forgotPassword(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }
  refreshToken(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }
  logout(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }

  register(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }

  login(req: Request, res: Response, next: NextFunction) {
    const deviceLoginInfor = `[${new Date()}] [${req.headers["user-agent"]}] [${
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    }]`;
    const { identifier, password } = req.body;
    const r = this.authService.login(identifier, password, deviceLoginInfor);
    // res.status(200).json({
  }
}
