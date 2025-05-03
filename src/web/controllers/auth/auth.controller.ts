import { NextFunction, Request, Response } from "express";
import BaseController from "../../utils/base-controller";
import asyncUtil from "../../utils/async-wrapper";

export default class AuthController extends BaseController {
  public initRoutes(): void {
    this.router.post("/login", asyncUtil(this.login));
  }

  login(req: Request, res: Response, next: NextFunction) {
    res.status(200).json({
      message: "Login successful",
    });
  }
}
