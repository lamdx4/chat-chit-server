import { Brackets } from "typeorm";
import Stream from "stream";
import GroupRepository from "../../infras/data/repository/group.repository";
import CreateGroupRequest from "../../web/controllers/group/reqs/create-group.request";
import { Result } from "../../web/utils/result";
import RelationshipRepository from "../../infras/data/repository/relationship.repository";
import { RelationType } from "../../core/entities/relationship.entity";
import { GroupChat } from "../../core/entities/group-chat.entity";
import { GroupItemDto, MessageDto, MemberDto } from "./dtos/group-list.dto";
import { CursorPaging } from "../../web/utils/response-pagination";
import { MessageType } from "../../core/entities/message.entity";
import { Member } from "../../core/entities/member.entity";
import MessageRepository from "../../infras/data/repository/message.repository";
import { CloudService } from "../../infras/aws-s3/aws-s3.service";
import { TransformUtil } from "../utils/transform.util";
import MessageService from "./message.service";

export default class GroupService {
  private groupRepository: GroupRepository;
  private messageRepository: MessageRepository;
  private relationshipRepository: RelationshipRepository;
  private messageService: MessageService; // Assuming this is defined elsewhere
  constructor() {
    this.messageService = new MessageService(); // Initialize the message service
    this.messageRepository = new MessageRepository(); // Initialize the message repository
    this.groupRepository = new GroupRepository(); // Initialize the repository
    this.relationshipRepository = new RelationshipRepository(); // Initialize the relationship repository
  }

  async addMemberToGroup(groupId: number, userId: number, friendIds: number[]) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }

    // const relationships = await this.relationshipRepository
    //   .createQueryBuilder("relationship")
    //   .where("relationship.relationType = :friendType", {
    //     friendType: RelationType.Friend,
    //   })
    //   .andWhere(
    //     new Brackets((qb) => {
    //       qb.where(
    //         "relationship.requesterId = :userId AND relationship.addresseeId IN (:...memberIds)",
    //         { userId: userId, memberIds: friendIds }
    //       ).orWhere(
    //         "relationship.addresseeId = :userId AND relationship.requesterId IN (:...memberIds)",
    //         { userId: userId, memberIds: friendIds }
    //       );
    //     })
    //   )
    //   .getMany();

    // // Check if all members exist in the database
    // if (relationships.length !== friendIds.length) {
    //   return Result.fail(400, "NOT_ALL_MEMBERS_ARE_FRIENDS");
    // }

    const isSuccessfully = await this.groupRepository.addMemberToGroup(
      groupId,
      friendIds
    );

    if (!isSuccessfully) {
      return Result.fail(400, "ADD_MEMBER_TO_GROUP_FAILED");
    } else {
      const latestMessage =
        await this.messageRepository.getLatestMessageFromGroup(groupId);
      const groupDto = await TransformUtil.toDto(
        GroupItemDto,
        {
          ...(await this.groupRepository.getGroupById(groupId)),
          latestMessage: latestMessage,
          messages: latestMessage ? [latestMessage] : [], // No messages yet
        },
        {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        }
      );
      return Result.ok(groupDto);
    }
  }

  async endThePollMessage(groupId: number, userId: number, messageId: number) {
    return Result.ok();
  }

  async reactMessage(
    groupId: number,
    userId: number,
    messageId: number,
    emoji: string
  ) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const message = await this.messageRepository.findOne({
      where: { messageId: messageId },
    });
    if (!message) {
      return Result.fail(404, "MESSAGE_NOT_FOUND");
    }

    return await this.messageService.reactMessage(
      messageId,
      emoji,
      getCurrentMember.memberId
    );
  }

  async changeEmojiGroup(groupId: number, userId: number, emoji: any) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const isSuccessfully = await this.groupRepository.changeEmojiGroup(
      groupId,
      emoji
    );
    if (!isSuccessfully) {
      return Result.fail(400, "CHANGE_EMOJI_GROUP_FAILED");
    } else {
      return Result.ok({ emoji: emoji });
    }
  }

  async viewNewMessage(groupId: number, userId: number) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);

    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const latestMessage =
      await this.messageRepository.getLatestMessageFromGroup(groupId);
    const isSuccessfully = await this.groupRepository.viewNewMessage(
      groupId,
      getCurrentMember.memberId
    );
    if (!isSuccessfully) {
      return Result.fail(400, "VIEW_NEW_MESSAGE_FAILED");
    } else {
      return Result.ok();
    }
  }

  async getMemberInfo(userId: number, groupId: number, memberId: number) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const member = await this.groupRepository.getMemberInfo(
      groupId,
      memberId,
      userId
    );
    if (!member) {
      return Result.fail(404, "MEMBER_NOT_FOUND");
    }
    const memberDto = await TransformUtil.toDto(MemberDto, member, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true, // Ensure we map the member correctly
    });
    return Result.ok(memberDto);
  }

  async changeGroupAvatar(
    groupId: number,
    userId: number,
    file: Express.Multer.File
  ) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    if (!file) {
      return Result.fail(400, "NO_FILE_PROVIDED");
    }
    try {
      const fileStream = Stream.Readable.from(
        require("fs").createReadStream(file.path)
      );
      // Generate a unique filename using UUID
      const key = "groups/" + file.filename;
      await CloudService.getInstance().uploadStreamFile(
        key,
        fileStream,
        file.mimetype
      );
      const isSuccessfully = await this.groupRepository.changeGroupAvatar(
        groupId,
        key,
        file.mimetype
      );
      if (!isSuccessfully) {
        return Result.fail(400, "CHANGE_GROUP_AVATAR_FAILED");
      } else {
        //TODO: delete avatar file in S3 if it exists
        return Result.ok({
          newAvatar: await CloudService.getInstance().getFilePreSignerUrl(key),
        });
      }
    } catch (error) {
      console.error("Error uploading group avatar:", error);
      return Result.fail(500, "FAILED_TO_UPLOAD_GROUP_AVATAR");
    }
  }

  async renameGroup(groupId: number, userId: number, name: string) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const isSuccessfully = await this.groupRepository.renameGroup(
      groupId,
      name
    );
    await this.messageService.sendNotifyMessage(
      userId,
      "@ renamed the group to " + name,
      [getCurrentMember.memberId]
    );
    if (!isSuccessfully) {
      return Result.fail(400, "RENAME_GROUP_FAILED");
    } else return Result.ok();
  }

  async votePollMessage(
    groupId: number,
    userId: number,
    messageId: number,
    optionIds: number[]
  ) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const message = await this.messageRepository.findOne({
      where: { messageId: messageId },
    });

    if (!message) {
      return Result.fail(404, "MESSAGE_NOT_FOUND");
    }
    const optionId = optionIds[0];
    const option = message.poll.options.find(
      (opt) => opt.optionId === optionId
    );

    if (!option) {
      return Result.fail(404, "OPTION_NOT_FOUND");
    }

    const hasVoted = await this.messageRepository.hasVotedPollMessage(
      getCurrentMember.memberId,
      messageId
    );

    if (hasVoted && !message.poll.isMultipleChoice) {
      return Result.fail(400, "MULTIPLE_CHOICE_POLL_NOT_SUPPORTED");
    }

    const updatedOption = await this.messageRepository.votePollMessage(
      getCurrentMember.memberId,
      messageId,
      optionId
    );
    if (!updatedOption) {
      return Result.fail(400, "VOTE_POLL_FAILED");
    }
    return Result.ok(
      await TransformUtil.toDto(
        MessageDto,
        await this.messageRepository.findOne({
          where: { messageId: message.messageId },
        }),
        {
          excludeExtraneousValues: true,
          enableImplicitConversion: true, // Ensure we map the message correctly
        }
      )
    );
  }

  async getSearchMemberFromGroup(
    groupId: number,
    userId: number,
    searchTerm: string,
    limit: number
  ) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const members = await this.groupRepository.getSearchMemberFromGroup(
      groupId,
      searchTerm,
      limit
    );
    const memberDtos = await Promise.all(
      members.map(
        async (member) =>
          await TransformUtil.toDto(MemberDto, member, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true, // Ensure we map the member correctly
          })
      )
    );
    return Result.ok(memberDtos);
  }

  async createPollMessage(
    groupId: number,
    userId: number,
    content: string,
    isMultipleChoice: boolean,
    expiredAt: Date | undefined,
    options: string[]
  ) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const m = await this.messageRepository.sendPollMessage(
      getCurrentMember.memberId,
      content,
      expiredAt,
      isMultipleChoice,
      options
    );
    return Result.ok(
      await TransformUtil.toDto(MessageDto, m, {
        excludeExtraneousValues: true,
        enableImplicitConversion: true, // Ensure we map the message correctly
      })
    );
  }

  async sendMessageToGroup(
    groupId: number,
    userId: number,
    content: string,
    messageType: MessageType,
    replyMessageId?: number | null,
    manipulates: number[] = []
  ) {
    const getCurrentMember: Member | null =
      await this.groupRepository.getCurrentMember(groupId, userId);
    if (!getCurrentMember) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    if (messageType === MessageType.Text || messageType === MessageType.Gif) {
      const m = await this.messageRepository.sendTextMessage(
        getCurrentMember.memberId,
        content,
        messageType,
        manipulates,
        replyMessageId
      );
      return Result.ok(
        await TransformUtil.toDto(MessageDto, m, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true, // Ensure we map the message correctly
        })
      );
    } else if (messageType === MessageType.File) {
      return Result.fail(400, "INVALID_MESSAGE_TYPE");
    } else {
      return Result.fail(400, "INVALID_MESSAGE_TYPE");
    }
  }

  async sendFileMessageToGroup(
    groupId: number,
    userId: number,
    files: Express.Multer.File[],
    replyMessageId?: number | null,
    content: string = "",
    manipulates: number[] = []
  ) {
    try {
      const getCurrentMember: Member | null =
        await this.groupRepository.getCurrentMember(groupId, userId);
      if (!getCurrentMember) {
        return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
      }
      if (!files || files.length === 0) {
        return Result.fail(400, "NO_FILE_PROVIDED");
      }
      const messages = await this.messageRepository.sendFileMessage(
        getCurrentMember.memberId,
        async () => {
          let listKey: { key: string; mimeType: string }[] = [];
          try {
            for (const file of files) {
              const fileStream = Stream.Readable.from(
                require("fs").createReadStream(file.path)
              );
              // Generate a unique filename using UUID
              const key = "messages/" + file.filename;
              await CloudService.getInstance().uploadStreamFile(
                key,
                fileStream,
                file.mimetype
              );
              listKey.push({ key: key, mimeType: file.mimetype });
            }
            return listKey;
          } catch (error) {
            for (const key of listKey) {
              try {
                await CloudService.getInstance().deleteFile(key.key);
              } catch (deleteError) {
                console.error("Failed to delete file:", key, deleteError);
              }
            }
            console.error("Error uploading files:", error);
            throw new Error("FILE_UPLOAD_FAILED");
          }
        },
        content,
        manipulates,
        replyMessageId
      );

      return Result.ok(
        await TransformUtil.toDto(
          MessageDto,
          await this.messageRepository.findOne({
            where: { messageId: messages[0].messageId }, // Assuming messages is an array and we want the first one
            relations: ["replyMessage"],
          }),
          {
            excludeExtraneousValues: true,
            enableImplicitConversion: true, // Ensure we map the message correctly
          }
        )
      );
    } catch (error) {
      console.error("Error sending file message to group:", error);
      return Result.fail(500, "FAILED_TO_SEND_FILE_MESSAGE");
    }
  }

  // Define methods for group-related operations here
  // For example:
  async createGroup(userId: number, groupData: CreateGroupRequest) {
    const relationships = await this.relationshipRepository
      .createQueryBuilder("relationship")
      .where("relationship.relationType = :friendType", {
        friendType: RelationType.Friend,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "relationship.requesterId = :userId AND relationship.addresseeId IN (:...friendIds)",
            { userId: userId, friendIds: groupData.members }
          ).orWhere(
            "relationship.addresseeId = :userId AND relationship.requesterId IN (:...friendIds)",
            { userId: userId, friendIds: groupData.members }
          );
        })
      )
      .getMany();

    // Check if all members exist in the database
    if (relationships.length !== groupData.members.length) {
      return Result.fail(400, "NOT_ALL_MEMBERS_ARE_FRIENDS");
    }
    let g: GroupChat | null = null;
    try {
      g = await this.groupRepository.createGroup(userId, groupData);
      if (!g) {
        return Result.fail(400, "CREATE_GROUP_FAILED");
      } else {
        const groupDto = await this.getGroupById(g.groupId, userId);
        return Result.ok(groupDto.data);
      }
    } catch (e) {
      return Result.fail(500, "CREATE_GROUP_FAILED");
    }
  }

  async createDirectMessageGroup(userId1: number, userId2: number) {
    const g = await this.groupRepository.findDirectMessageGroup(
      userId1,
      userId2
    );
    if (g) {
      return Result.ok(g);
    }
    return await this.groupRepository.createDirectMessageGroup(
      userId1,
      userId2
    );
  }

  async getGroupById(groupId: number, userId: number) {
    if (
      await this.isUserInGroup(userId, groupId).then((res) => !res.isSuccess)
    ) {
      return Result.fail(400, "USER_NOT_MEMBER_OF_GROUP");
    }
    const latestMessage =
      await this.messageRepository.getLatestMessageFromGroup(groupId);
    const groupDto = await TransformUtil.toDto(
      GroupItemDto,
      {
        ...(await this.groupRepository.getGroupById(groupId)),
        latestMessage: latestMessage,
        messages: latestMessage ? [latestMessage] : [], // No messages yet
      },
      {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }
    );
    return Result.ok(groupDto);
  }

  async updateGroup(groupId: number, groupData: any): Promise<any> {
    // Logic to update a group's information
  }

  async deleteGroup(groupId: number): Promise<any> {
    // Logic to delete a group
  }

  /**
   * Get list of groups that a user is a member of with cursor-based pagination
   * @param userId - The ID of the user
   * @param cursor - The cursor for pagination (latest message ID)
   * @param limit - Maximum number of groups to return (1-100)
   * @returns Result containing paginated list of groups with metadata
   */
  async getListGroupByUserId(
    userId: number,
    cursor: number = Number.MAX_SAFE_INTEGER,
    limit: number = 20
  ): Promise<Result<CursorPaging<GroupItemDto, number>>> {
    try {
      // Input validation
      if (!userId || userId <= 0) {
        return Result.badRequest("INVALID_USER_ID");
      }

      if (limit <= 0 || limit > 100) {
        return Result.badRequest("INVALID_LIMIT", {
          limit: ["Limit must be between 1 and 100"],
        });
      }

      if (cursor < 0) {
        return Result.badRequest("INVALID_CURSOR", {
          cursor: ["Cursor must be non-negative"],
        });
      }

      const groups = await this.groupRepository.getMyListGroupByUserId(
        userId,
        cursor !== Number.MAX_SAFE_INTEGER ? cursor : undefined,
        limit
      );

      // Handle cursor pagination
      // Repository fetches limit + 1 records to check if there's a next page
      const hasNextPage = groups.length > limit;

      const actualGroups = hasNextPage ? groups.slice(0, limit) : groups;

      // Process only the actual groups (without the extra record)
      const groupListItems = await Promise.all(
        actualGroups.map(async (group): Promise<GroupItemDto> => {
          const [latestMessage, unreadCount, currentMember, memberCount] =
            await Promise.all([
              this.messageRepository.getLatestMessageFromGroup(group.groupId),
              this.groupRepository.getUnreadMessageCount(group.groupId, userId),
              this.groupRepository.getCurrentMember(group.groupId, userId),
              this.groupRepository.getMemberCount(group.groupId),
            ]);

          // Validate that currentMember exists - this should always be true for groups the user is a member of
          if (!currentMember) {
            throw new Error(
              `User ${userId} is not a member of group ${group.groupId}`
            );
          }
          console.log(`Processing group:`, latestMessage);
          return await TransformUtil.toDto(
            GroupItemDto,
            {
              ...group,
              latestMessage: latestMessage,
              members:
                (await this.groupRepository.getListMembersOfGroup(
                  group.groupId
                )) || [],
              messages: latestMessage ? [latestMessage] : [],
              currentMember: currentMember,
              unreadCount,
              latestMessageId: latestMessage?.messageId || null, // For cursor
              memberCount,
            },
            {
              excludeExtraneousValues: true,
              enableImplicitConversion: true,
            }
          );
        })
      );

      // Set up pagination response
      const nextCursor =
        hasNextPage && groupListItems.length > 0
          ? groupListItems[groupListItems.length - 1].latestMessage
              ?.messageId || null
          : null;

      const paging = new CursorPaging<GroupItemDto, number>(
        groupListItems,
        nextCursor
      );

      return Result.ok(paging);
    } catch (error) {
      console.error("Error getting group list:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("not a member of group")) {
          return Result.badRequest("USER_NOT_MEMBER_OF_GROUP");
        }
        if (error.message.includes("Failed to map")) {
          return Result.fail(500, "DATA_MAPPING_ERROR");
        }
      }

      return Result.fail(500, "FAILED_TO_GET_GROUP_LIST");
    }
  }

  /**
   * Get or create a direct message group between two users
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns Result containing the direct message group
   */
  async getOrCreateDirectMessageGroup(
    userId1: number,
    userId2: number
  ): Promise<Result<GroupChat>> {
    try {
      // Input validation
      if (!userId1 || userId1 <= 0) {
        return Result.badRequest("INVALID_USER_ID_1");
      }

      if (!userId2 || userId2 <= 0) {
        return Result.badRequest("INVALID_USER_ID_2");
      }

      if (userId1 === userId2) {
        return Result.badRequest("CANNOT_CREATE_DIRECT_MESSAGE_WITH_SELF");
      }

      // Check if users are friends
      const relationship = await this.relationshipRepository
        .createQueryBuilder("relationship")
        .where("relationship.relationType = :friendType", {
          friendType: RelationType.Friend,
        })
        .andWhere(
          "(relationship.requesterId = :userId1 AND relationship.addresseeId = :userId2) OR " +
            "(relationship.requesterId = :userId2 AND relationship.addresseeId = :userId1)",
          { userId1, userId2 }
        )
        .getOne();

      if (!relationship) {
        return Result.badRequest("USERS_ARE_NOT_FRIENDS");
      }

      // Try to find existing direct message group
      let directGroup = await this.groupRepository.findDirectMessageGroup(
        userId1,
        userId2
      );

      // If not exists, create new one
      if (!directGroup) {
        directGroup = await this.groupRepository.createDirectMessageGroup(
          userId1,
          userId2
        );
      }

      return Result.ok(directGroup);
    } catch (error) {
      console.error("Error getting or creating direct message group:", error);
      return Result.fail(500, "FAILED_TO_GET_OR_CREATE_DIRECT_MESSAGE_GROUP");
    }
  }

  /**
   * Find existing direct message group between two users
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns Result containing the direct message group or null if not found
   */
  async findDirectMessageGroup(
    userId1: number,
    userId2: number
  ): Promise<Result<GroupChat | null>> {
    try {
      // Input validation
      if (!userId1 || userId1 <= 0) {
        return Result.badRequest("INVALID_USER_ID_1");
      }

      if (!userId2 || userId2 <= 0) {
        return Result.badRequest("INVALID_USER_ID_2");
      }

      if (userId1 === userId2) {
        return Result.badRequest("CANNOT_FIND_DIRECT_MESSAGE_WITH_SELF");
      }

      const directGroup = await this.groupRepository.findDirectMessageGroup(
        userId1,
        userId2
      );

      return Result.ok(directGroup);
    } catch (error) {
      console.error("Error finding direct message group:", error);
      return Result.fail(500, "FAILED_TO_FIND_DIRECT_MESSAGE_GROUP");
    }
  }

  async isUserInGroup(
    userId: number,
    groupId: number
  ): Promise<Result<boolean>> {
    try {
      const member = await this.groupRepository.getCurrentMember(
        groupId,
        userId
      );
      return Result.success(200, member !== null);
    } catch (error) {
      console.error("Error checking group membership:", error);
      return Result.fail(400); // Return false on error
    }
  }

  async getAllGroup(userId: number): Promise<Result<GroupChat[]>> {
    try {
      const groups = await this.groupRepository.findBy({
        members: {
          userId: userId,
        },
      });
      return Result.ok(groups);
    } catch (error) {
      console.error("Error getting all groups:", error);
      return Result.fail(500, "FAILED_TO_GET_ALL_GROUPS");
    }
  }

  async getOneGroup(
    groupId: number,
    userId: number
  ): Promise<Result<GroupChat | null>> {
    try {
      const group = await this.groupRepository.findOne({
        where: { groupId: groupId },
        relations: ["members", "messages"],
      });
      if (!group) {
        return Result.fail(404, "GROUP_NOT_FOUND");
      }
      const isMember = group.members.some((member) => member.userId === userId);
      if (!isMember) {
        return Result.fail(403, "USER_NOT_MEMBER_OF_GROUP");
      }
      return Result.ok(group);
    } catch (error) {
      console.error("Error getting group:", error);
      return Result.fail(500, "FAILED_TO_GET_GROUP");
    }
  }
}
