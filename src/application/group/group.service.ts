import { Brackets } from "typeorm";
import { plainToClass } from "class-transformer";
import GroupRepository from "../../infras/data/repository/group.repository";
import UserRepository from "../../infras/data/repository/user.repository";
import CreateGroupRequest from "../../web/controllers/group/reqs/create-group.request";
import { Result } from "../../web/utils/result";
import RelationshipRepository from "../../infras/data/repository/relationship.repository";
import { RelationType } from "../../core/entities/relationship.entity";
import { GroupChat } from "../../core/entities/group-chat.entity";
import { GroupListItemDto, MessageDto, MemberDto } from "./dtos/group-list.dto";
import { CursorPaging } from "../../web/utils/response-pagination";
import { Message } from "../../core/entities/message.entity";
import { Member } from "../../core/entities/member.entity";

export default class GroupService {
  private groupRepository: GroupRepository;
  private relationshipRepository: RelationshipRepository;
  private userRepository: UserRepository;
  constructor() {
    this.groupRepository = new GroupRepository(); // Initialize the repository
    this.userRepository = new UserRepository(); // Initialize the user repository
    this.relationshipRepository = new RelationshipRepository(); // Initialize the relationship repository
  }

  /**
   * Maps a Message entity to MessageDto using class-transformer
   * @param message - The message entity or null
   * @returns MessageDto or undefined if message is null
   */
  private mapMessageToDto(message: Message | null): MessageDto | undefined {
    if (!message) return undefined;

    const dto = plainToClass(MessageDto, message, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    // Set sender as alias for ownerMember for backward compatibility
    if (message.ownerMember) {
      dto.sender = plainToClass(MemberDto, message.ownerMember, {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      });
    }

    return dto;
  }

  /**
   * Maps a Member entity to MemberDto using class-transformer
   * @param member - The member entity or null
   * @returns MemberDto or undefined if member is null
   */
  private mapMemberToDto(member: Member | null): MemberDto | undefined {
    if (!member) return undefined;

    return plainToClass(MemberDto, member, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
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
    } catch (e) {
      return Result.fail(500, "CREATE_GROUP_FAILED");
    }

    return Result.ok();
  }

  async getGroupsByUserId(userId: number): Promise<any> {}

  async getGroupById(groupId: number): Promise<any> {
    // Logic to retrieve a group by its ID
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
  ): Promise<Result<CursorPaging<GroupListItemDto, number>>> {
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
        actualGroups.map(async (group): Promise<GroupListItemDto> => {
          const [latestMessage, unreadCount, currentMember, memberCount] =
            await Promise.all([
              this.groupRepository.getLatestMessage(group.groupId),
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

          const mappedCurrentMember = this.mapMemberToDto(currentMember);
          if (!mappedCurrentMember) {
            throw new Error(
              `Failed to map current member for user ${userId} in group ${group.groupId}`
            );
          }

          return plainToClass(
            GroupListItemDto,
            {
              ...group,
              latestMessage: this.mapMessageToDto(latestMessage),
              currentMember: mappedCurrentMember,
              unreadCount,
              latestMessageId: (group as any).latestMessageId, // For cursor
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
          ? groupListItems[groupListItems.length - 1].latestMessage?.messageId || null
          : null;

      const paging = new CursorPaging<GroupListItemDto, number>(
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
}
