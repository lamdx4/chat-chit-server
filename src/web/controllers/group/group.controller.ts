import { Request, Response, NextFunction } from "express";
import GroupService from "../../../application/group/group.service";
import CreateGroupRequest from "./reqs/create-group.request";
import { ResponseData } from "../../utils/response-data";
import MessageService from "../../../application/group/message.service";
import { getSocketIoServer } from "../../socketio/socket-io";
import {
  getGroupRoom,
  getPersonalRoom,
  SocketIoEvent,
} from "../../socketio/event.constant";
import { GroupItemDto } from "../../../application/group/dtos/group-list.dto";
import { Result } from "../../utils/result";

export default class GroupController {
  private groupService: GroupService;
  private messageService: MessageService; // Assuming this is defined elsewhere

  constructor() {
    this.groupService = new GroupService();
    this.messageService = new MessageService();
  }

  async viewNewMessage(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const result = await this.groupService.viewNewMessage(groupId, userId);
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.VIEW_NEW_MESSAGE, {
          groupId: groupId,
          memberId: 1,
        });
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async getSearchMemberFromGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = (req.query.search as string) || "";
    const result = await this.groupService.getSearchMemberFromGroup(
      groupId,
      userId,
      searchTerm,
      limit
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data!, result.message));
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  //TODO: Implement send noti message
  async renameGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const name = req.body.name;
    const result = await this.groupService.renameGroup(groupId, userId, name);
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.RENAME_GROUP, {
          groupId: groupId,
          name: name,
        });
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  //TODO: Implement send noti message
  async changeGroupAvatar(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const file = req.file as Express.Multer.File; // Assuming multer is used for file uploads
    const result = await this.groupService.changeGroupAvatar(
      groupId,
      userId,
      file
    );
    if (result.isSuccess) {
      res.status(200).json(
        ResponseData.success({
          avatar: result.data!.newAvatar,
        })
      );
      if (result.data instanceof Object)
        getSocketIoServer()
          .to(getGroupRoom(groupId))
          .emit(SocketIoEvent.CHANGE_AVATAR_GROUP, {
            groupId: groupId,
            avatar: result.data.newAvatar,
          });
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const reqData: CreateGroupRequest = req.body;
    const r = await this.groupService.createGroup(userId, reqData);
    if (r.isSuccess) {
      if (r.data instanceof GroupItemDto) {
        const userIds = reqData.members;
        const sockets = await getSocketIoServer().fetchSockets();
        for (const socket of sockets) {
          if (
            userIds.includes(socket.data.userId) ||
            socket.data.userId === userId
          ) {
            socket.join(getGroupRoom(r.data.groupId));
          }

          for (const member of r.data.members) {
            getSocketIoServer()
              .to(getPersonalRoom(member.userId))
              .emit(SocketIoEvent.NEW_GROUP, r.data);
          }
        }
        res.status(200).json(ResponseData.success(r.data, r.message));
        return;
      }
      res.status(r.code).json(ResponseData.fail(r.message, r.errors));
    }
  }

  // async reactMessage(req: Request, res: Response, next: NextFunction) {
  //   const userId = req.userId!;
  //   const groupId = parseInt(req.params.groupId);
  //   const messageId = parseInt(req.params.messageId);
  //   const { emoji } = req.body;
  //   const result = await this.groupService.reactMessage(
  //     groupId,
  //     userId,
  //     messageId,
  //     emoji
  //   );
  //   if (result.isSuccess) {
  //     res.status(200).json(ResponseData.success(result.data, result.message));
  //     getSocketIoServer()
  //       .to(getGroupRoom(groupId))
  //       .emit(SocketIoEvent.NEW_MESSAGE, result.data);
  //   } else {
  //     res
  //       .status(result.code)
  //       .json(ResponseData.fail(result.message, result.errors));
  //   }
  // }

  // async changeEmojiGroup(req: Request, res: Response, next: NextFunction) {
  //   const userId = req.userId!;
  //   const groupId = parseInt(req.params.groupId);
  //   const emoji = req.body.emoji;
  //   const result = await this.groupService.changeEmojiGroup(
  //     groupId,
  //     userId,
  //     emoji
  //   );
  //   if (result.isSuccess) {
  //     res.status(200).json(ResponseData.success(result.data, result.message));
  //     getSocketIoServer()
  //       .to(getGroupRoom(groupId))
  //       .emit(SocketIoEvent.CHANGE_GROUP_AVATAR, {
  //         groupId: groupId,
  //         emoji: result.data,
  //       });
  //   } else {
  //     res
  //       .status(result.code)
  //       .json(ResponseData.fail(result.message, result.errors));
  //   }
  // }

  async getGroupById(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const result = await this.groupService.getGroupById(groupId, userId);
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data!, result.message));
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async getMyListGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const cursor =
      parseInt(req.query.cursor as string) || Number.MAX_SAFE_INTEGER;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await this.groupService.getListGroupByUserId(
      userId,
      cursor,
      limit
    );
    if (result.isSuccess) {
      res
        .status(200)
        .json(ResponseData.success(result.data!.toResponse(), result.message));
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async getListMessageFromGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const cursor =
      parseInt(req.query.cursor as string) || Number.MAX_SAFE_INTEGER;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await this.messageService.getAllMessageFromGroup(
      groupId,
      userId,
      cursor,
      limit
    );
    if (result.isSuccess) {
      res
        .status(200)
        .json(ResponseData.success(result.data!.toResponse(), result.message));
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async sendMessageToGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const { content, messageType, replyMessageId, manipulates } = req.body;
    const result = await this.groupService.sendMessageToGroup(
      groupId,
      userId,
      content,
      messageType,
      replyMessageId,
      manipulates
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.NEW_MESSAGE, result.data);
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async sendFileToGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const { content, replyMessageId, manipulates } = req.body;
    const files = req.files as Express.Multer.File[]; // Assuming multer is used for file uploads
    const result = await this.groupService.sendFileMessageToGroup(
      groupId,
      userId,
      files,
      replyMessageId,
      content,
      manipulates
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.NEW_MESSAGE, result.data);
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async createPollMessage(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const { content, options, isMultipleChoice, expiredAt } = req.body;
    const result = await this.groupService.createPollMessage(
      groupId,
      userId,
      content,
      isMultipleChoice,
      expiredAt,
      options
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.NEW_MESSAGE, result.data);
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async getInfoMemberFromGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);
    const result = await this.groupService.getMemberInfo(
      userId,
      groupId,
      memberId
    );
    if (result.isSuccess) {
      return res
        .status(200)
        .json(ResponseData.success(result.data, result.message));
    } else {
      return res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async votePollMessage(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const messageId = parseInt(req.params.messageId);
    const optionIds = req.body.optionIds as number[]; // Assuming optionsId is an array of numbers

    const result = await this.groupService.votePollMessage(
      groupId,
      userId,
      messageId,
      optionIds
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data));
      console.log(result.data?.poll?.options);
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.MEMBER_VOTE_POLL, result.data);
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async endThePollMessage(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const messageId = parseInt(req.params.messageId);
    const result = await this.groupService.endThePollMessage(
      groupId,
      userId,
      messageId
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.NEW_MESSAGE, result.data);
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async addMemberToGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const memberIds: number[] = req.body; // Assuming memberIds is an array of user IDs
    console.log("Add member to group", {
      userId,
      groupId,
      memberIds,
    });
    const result = await this.groupService.addMemberToGroup(
      groupId,
      userId,
      memberIds
    );
    if (result.isSuccess) {
      const sockets = await getSocketIoServer().fetchSockets();
      for (const socket of sockets) {
        if (memberIds.includes(socket.data.userId)) {
          socket.join(getGroupRoom(groupId));
        }

        for (const member of memberIds) {
          getSocketIoServer()
            .to(getPersonalRoom(member))
            .emit(SocketIoEvent.NEW_GROUP, result.data);
        }
      }
      res.status(200).json(ResponseData.success(result.data, result.message));
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async changeEmojiGroup(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const emoji = req.body.emoji;
    const result = await this.groupService.changeEmojiGroup(
      groupId,
      userId,
      emoji
    );
    if (result.isSuccess) {
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.CHANGE_EMOJI_AVATAR, {
          groupId: groupId,
          emoji: emoji,
        });
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }

  async reactMessage(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const groupId = parseInt(req.params.groupId);
    const messageId = parseInt(req.params.messageId);
    const { emoji } = req.body;
    const result = await this.groupService.reactMessage(
      groupId,
      userId,
      messageId,
      emoji
    );
    if (result.isSuccess) {
      console.log(result.data);
      res.status(200).json(ResponseData.success(result.data, result.message));
      getSocketIoServer()
        .to(getGroupRoom(groupId))
        .emit(SocketIoEvent.REACT_MESSAGE, {
          groupId: groupId,
          message: result.data,
        });
    } else {
      res
        .status(result.code)
        .json(ResponseData.fail(result.message, result.errors));
    }
  }
}
