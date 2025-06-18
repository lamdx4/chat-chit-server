import { plainToClass } from "class-transformer";
import MessageRepository from "../../infras/data/repository/message.repository";
import GroupRepository from "../../infras/data/repository/group.repository";
import { Result } from "../../web/utils/result";
import { CursorPaging } from "../../web/utils/response-pagination";
import { MessageDto } from "./dtos/group-list.dto";
import { Message, MessageType } from "../../core/entities/message.entity";
import { TransformUtil } from "../utils/transform.util";

export default class MessageService {
  private messageRepository: MessageRepository;
  private groupRepository: GroupRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
    this.groupRepository = new GroupRepository();
  }

  /**
   * Maps a Message entity to MessageDto using class-transformer
   * @param message - The message entity or null
   * @returns MessageDto or undefined if message is null
   */
  private mapMessageToDto(message: Message | null): MessageDto | undefined {
    if (!message) return undefined;
    return plainToClass(MessageDto, message, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  /**
   * Get list of messages from a group with cursor-based pagination
   * @param groupId - The ID of the group
   * @param userId - The ID of the requesting user (for permission check)
   * @param cursor - The messageId to start from (gets messages older than this)
   * @param limit - Maximum number of messages to return (1-100)
   * @returns Result containing paginated list of messages
   */
  async getAllMessageFromGroup(
    groupId: number,
    userId: number,
    cursor?: number,
    limit: number = 20
  ): Promise<Result<CursorPaging<MessageDto, number>>> {
    try {
      // Check if user is member of the group
      const currentMember = await this.groupRepository.getCurrentMember(
        groupId,
        userId
      );
      if (!currentMember) {
        return Result.badRequest("USER_NOT_MEMBER_OF_GROUP");
      }

      // Get messages with one extra to check for next page
      const messages = await this.messageRepository.getListMessageFromGroup(
        groupId,
        cursor,
        limit + 1
      );

      // Handle pagination
      const hasNextPage = messages.length > limit;
      const actualMessages = hasNextPage ? messages.slice(0, limit) : messages;
      // Map to DTOs
      const messagePromises = actualMessages.map(async (message) => {
        return await TransformUtil.toDto(MessageDto, message, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true, // Ensure we map the message correctly
        });
      });
      const messageDtos = await Promise.all(messagePromises);

      // Set up pagination response
      const nextCursor =
        hasNextPage && actualMessages.length > 0
          ? actualMessages[actualMessages.length - 1].messageId
          : null;

      const paging = new CursorPaging<MessageDto, number>(
        messageDtos,
        nextCursor
      );

      return Result.ok(paging);
    } catch (error) {
      console.error("Error getting messages from group:", error);
      return Result.fail(500, "FAILED_TO_GET_MESSAGES");
    }
  }

  /**
   * Get new messages from a group after a specific messageId (for real-time updates)
   * @param groupId - The ID of the group
   * @param userId - The ID of the requesting user
   * @param afterMessageId - Get messages newer than this messageId
   * @param limit - Maximum number of messages to return
   * @returns Result containing array of new messages
   */
  async getNewMessagesFromGroup(
    groupId: number,
    userId: number,
    afterMessageId: number,
    limit: number = 50
  ): Promise<Result<MessageDto[]>> {
    try {
      // Input validation
      if (!groupId || groupId <= 0) {
        return Result.badRequest("INVALID_GROUP_ID");
      }

      if (!userId || userId <= 0) {
        return Result.badRequest("INVALID_USER_ID");
      }

      if (!afterMessageId || afterMessageId <= 0) {
        return Result.badRequest("INVALID_AFTER_MESSAGE_ID");
      }

      if (limit <= 0 || limit > 100) {
        return Result.badRequest("INVALID_LIMIT", {
          limit: ["Limit must be between 1 and 100"],
        });
      }

      // Check if user is member of the group
      const currentMember = await this.groupRepository.getCurrentMember(
        groupId,
        userId
      );
      if (!currentMember) {
        return Result.badRequest("USER_NOT_MEMBER_OF_GROUP");
      }

      // Get new messages
      const newMessages = await this.messageRepository.getNewMessagesFromGroup(
        groupId,
        afterMessageId,
        limit
      );

      // Map to DTOs
      const messageDtos = newMessages
        .map((message) => this.mapMessageToDto(message))
        .filter((dto) => dto !== undefined) as MessageDto[];

      return Result.ok(messageDtos);
    } catch (error) {
      console.error("Error getting new messages from group:", error);
      return Result.fail(500, "FAILED_TO_GET_NEW_MESSAGES");
    }
  }

  async getAllFileFromGroup(groupId: number, cursor: number, limit: number) {}

  async getListPinMessage(userId: number, groupId: number) {}

  async isMessageContainInGroup(messageId: Number, groupId: Number) {}

  async changeStatusMessage(
    messageId: number
    // status: MessageStatus
  ) {
    // return await this.messageRepository.changeStatusMessage(messageId, status);
  }

  async sendNotifyMessage(
    memberId: number,
    content: string,
    manipulates: Array<number>
  ) {
    let regex2 = /\{\{@\}\}/g;
    let matches = content.match(regex2);
    let count = matches ? matches.length : 0; // Số lần xuất hiện của chuỗi `{{@}}`
    if (count != manipulates.length) {
    }
    return this.messageRepository.sendNotificationMessage(
      memberId,
      content,
      manipulates
    );
  }
  async reCallMessage(userId: number, groupId: number, messageId: number) {}

  async changePinMessage(
    groupId: number,
    messageId: number,
    userId: number,
    isPin: boolean
  ) {}

  async reactMessage(messageId: number, emoji: string, memberId: number) {
    const message = await this.messageRepository.findOneBy({
      messageId,
    });
    if (!message) {
      return Result.fail(404, "MESSAGE_NOT_FOUND");
    }

    if (message.type === MessageType.Notification) {
      return Result.fail(400, "CANNOT_REACT_TO_NOTIFICATION_MESSAGE");
    }

    const isSuccessfully = await this.messageRepository.reactMessage(
      messageId,
      memberId,
      emoji
    );

    if (!isSuccessfully) {
      return Result.fail(400, "REACT_MESSAGE_FAILED");
    } else {
      return Result.ok(
        await TransformUtil.toDto(
          MessageDto,
          await this.messageRepository.findOne({
            where: { messageId },
          }),
          {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          }
        )
      );
    }
  }
}
