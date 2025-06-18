import { NextFunction, Request, Response } from "express";
import GroupService from "../../application/group/group.service";
import { ResponseData } from "../utils/response-data";

const groupService = new GroupService();

export default function authorizeGroupMiddleware(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.userId;

    if (!groupId || isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Assuming you have a service to check group membership
    const isMember = await groupService.isUserInGroup(userId, groupId); // Implement this function

    if (isMember.data) {
      return res.status(403).json(ResponseData.fail("UNAUTHORIZED"));
    }
    const hasPermission = checkMemberPermission(userId, groupId, permission); // Implement this function
    next();
  };
}
function checkMemberPermission(
  userId: number,
  groupId: number,
  permission: string
) {
  return true;
}
