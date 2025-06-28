import { NextFunction, Request, Response } from "express";
import AuthService from "../../../application/auth/auth.service";
import { ResponseData } from "../../utils/response-data";
import { HttpStatus } from "../../utils/http-status-code";
import RegisterDto from "./reqs/register.dto";

export default class AuthController {
  private authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    const { oldPassword, newPassword } = req.body;
    const r = await this.authService.changePassword(
      req.userId!,
      oldPassword,
      newPassword
    );
    if (r.isSuccess) {
      res
        .status(HttpStatus.Ok)
        .json(ResponseData.success(r.data));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

  forgotPassword(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    const { refreshToken } = req.body;
    const r = await this.authService.refreshToken(refreshToken);
    if (r.isSuccess) {
      res
        .status(HttpStatus.Ok)
        .json(ResponseData.success(r.data, "Refresh token success"));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

  logout(req: Request, res: Response, next: NextFunction) {
    throw new Error("Method not implemented.");
  }

  async register(req: Request, res: Response, next: NextFunction) {
    const registerDto: RegisterDto = req.body;
    const r = await this.authService.register(
      registerDto.phone,
      registerDto.fullName,
      registerDto.password,
      registerDto.userName
    );
    if (r.isSuccess) {
      res
        .status(HttpStatus.Ok)
        .json(ResponseData.success(r.data, "Register success"));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

  async loginWithGoogle(req: Request, res: Response, next: NextFunction) {
    const { code } = req.body;
    const deviceLoginInfor = `[${new Date()}] [${req.headers["user-agent"]}] [${
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    }]`;
    const r = await this.authService.loginWithGoogle(code, deviceLoginInfor);
    if (r.isSuccess) {
      res
        .status(HttpStatus.Ok)
        .json(ResponseData.success(r.data, "Login with Google success"));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

  async getLoginUri(req: Request, res: Response, next: NextFunction) {
    const r = await this.authService.getLoginUri();
    if (r.isSuccess) {
      res
        .status(HttpStatus.Ok)
        .json(ResponseData.success(r.data, "Get login URI success"));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    const deviceLoginInfor = `[${new Date()}] [${req.headers["user-agent"]}] [${
      req.headers["x-forwarded-for"] || req.socket.remoteAddress
    }]`;
    const { identifier, password } = req.body;
    const r = await this.authService.login(
      identifier,
      password,
      deviceLoginInfor
    );
    if (r.isSuccess) {
      res
        .status(HttpStatus.Ok)
        .json(ResponseData.success(r.data, "Login success"));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

}
