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

  async getMyGroupList(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const cursor = parseInt(req.query.cursor as string) || Number.MAX_SAFE_INTEGER;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await this.groupService.getListGroupByUserId(userId, cursor, limit);
    if (result.isSuccess) {
      return res.status(200).json(ResponseData.success(result.data!.toResponse(), result.message));
    } else {
      return res.status(result.code).json(ResponseData.fail(result.message, result.errors));
    }
  }
}
