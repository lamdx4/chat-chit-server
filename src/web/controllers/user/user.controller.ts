import { NextFunction, Request, Response } from "express";
import UserService from "../../../application/user/user.service";
import { ResponseData } from "../../utils/response-data";
import { ChangeMyBaseProfileRequest } from "./req/change-base-profile.req";
import fs from "fs/promises";

export default class UserController {
  private userService: UserService;
  constructor() {
    this.userService = new UserService();
  }
  async linkGoogleToAccount(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const userId = req.userId!;
    const code = req.body.code as string;
    const result = await this.userService.linkGoogleToAccount(userId, code);
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data));
    } else {
      res.status(result.code).json(ResponseData.fail(result.message));
    }
  }

  async changeAvatar(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const file = req.file;
    if (!file) {
      res.status(400).json(ResponseData.fail("FILE_REQUIRED"));
      return;
    }
    const r = await this.userService.changeAvatar(userId, file);
    if (r.isSuccess) {
      res.status(200).json(ResponseData.success(r.data));
    } else {
      res.status(r.code).json(ResponseData.fail(r.message));
      await fs.unlink(file.path);
    }
  }

  async changeMyProfile(req: Request, res: Response, _next: NextFunction) {
    const changeData = req.body as ChangeMyBaseProfileRequest;
    const userId = req.userId!;
    const result = await this.userService.changeMyProfile(userId, changeData);
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data));
    } else {
      res.status(result.code).json(ResponseData.fail(result.message));
    }
  }

  async getMyProfile(req: Request, res: Response, _next: NextFunction) {
    const userId = req.userId!;

    const result = await this.userService.getMyProfile(userId);

    if (result.isSuccess) {
      return res.status(200).json(ResponseData.success(result.data));
    } else {
      return res.status(result.code).json(ResponseData.fail(result.message));
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    const userName = req.query.userName as string;
    const phone = req.query.phone as string;

    if (!userName && !phone) {
      res.status(400).json(ResponseData.fail("USER_NAME_OR_PHONE_REQUIRED"));
    }

    // Assuming you have a mediator instance available as this.mediator
    const result = await this.userService.searchUsers(userName, phone);

    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data));
    } else {
      res.status(result.code).json(ResponseData.fail(result.message));
    }
  }

  async changeUserName(req: Request, res: Response, _next: NextFunction) {
    const userId = req.userId!;
    const userName = req.body.userName as string;

    const result = await this.userService.changeUserName(userId, userName);

    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data));
    } else {
      res.status(result.code).json(ResponseData.fail(result.message));
    }
  }

  async getLinkUrlLogin(req: Request, res: Response, _next: NextFunction) {
    const userId = req.userId!;
    const result = await this.userService.getLinkUrlLogin(userId);
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data));
    } else {
      res.status(result.code).json(ResponseData.fail(result.message));
    }
  }
}
