import { Request, Response, NextFunction } from "express";
import GroupService from "../../../application/group/group.service";
import CreateGroupRequest from "./reqs/create-group.request";
import { ResponseData } from "../../utils/response-data";

export default class GroupController {
  private groupService: GroupService;
  constructor() {
    this.groupService = new GroupService();
  }

  async createGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const reqData: CreateGroupRequest = req.body;
    const r = await this.groupService.createGroup(userId, reqData);
    if (r.isSuccess) {
      return res.status(200).json(ResponseData.success(r.data, r.message));
    } else {
      return res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }
}
