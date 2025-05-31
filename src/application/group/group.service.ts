import { Brackets } from "typeorm";
import GroupRepository from "../../infras/data/repository/group.repository";
import UserRepository from "../../infras/data/repository/user.repository";
import CreateGroupRequest from "../../web/controllers/group/reqs/create-group.request";
import { Result } from "../../web/utils/result";
import RelationshipRepository from "../../infras/data/repository/relationship.repository";
import { RelationType } from "../../core/entities/relationship.entity";
import { GroupChat } from "../../core/entities/group-chat.entity";
import { GroupListItemDto } from "./dtos/group-list.dto";
import { CursorPaging } from "../../web/utils/response-pagination";
import { plainToClass } from "class-transformer";
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
      console.log(e);
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

  async getListGroupByUserId(
    userId: number,
    cursor: number = Number.MAX_SAFE_INTEGER,
    limit: number = 20
  ): Promise<Result<CursorPaging<GroupListItemDto, number>>> {
    try {
      const groups = await this.groupRepository.getMyListGroupByUserId(
        userId,
        cursor !== Number.MAX_SAFE_INTEGER ? cursor : undefined,
        limit
      );

      // Map to GroupListItemDto format
      const groupListItems: GroupListItemDto[] = [];

      for (const group of groups) {
        // Get the current user's member record
        const currentMember = group.members.find(m => m.userId === userId);
        
        if (!currentMember) continue;

        // Get latest message for this group
        const latestMessage = await this.groupRepository.getLatestMessage(group.groupId);

        // Get unread count for this group
        const unreadCount = await this.groupRepository.getUnreadMessageCount(group.groupId, userId);

        // Create the DTO
        const groupListItem: GroupListItemDto = {
          groupId: group.groupId,
          name: group.name,
          createAt: group.createAt,
          groupChatStatus: group.groupChatStatus,
          avatar: group.avatar,
          groupType: group.groupType,
          groupPrivacyType: group.groupPrivacyType,
          link: group.link,
          latestMessage: latestMessage ? {
            messageId: latestMessage.messageId,
            content: latestMessage.content,
            createdAt: latestMessage.createdAt,
            type: latestMessage.type,
            status: latestMessage.status,
            replyMessageId: latestMessage.replyMessageId,
            isPin: latestMessage.isPin,
            memberId: latestMessage.memberId,
            fileId: latestMessage.fileId
          } : undefined,
          currentMember: {
            memberId: currentMember.memberId,
            groupId: currentMember.groupId,
            userId: currentMember.userId,
            lastReadMessageId: currentMember.lastReadMessageId,
            lastReceivedMessageId: currentMember.lastReceivedMessageId,
            roleId: currentMember.roleId,
            status: currentMember.status,
            timeJoin: currentMember.timeJoin,
            nickName: currentMember.nickName
          },
          unreadCount,
          latestMessageId: (group as any).latestMessageId // For cursor
        };

        groupListItems.push(groupListItem);
      }

      // Get the next cursor from the last item's latestMessageId
      const nextCursor = groupListItems.length > 0 
        ? groupListItems[groupListItems.length - 1].latestMessageId || null
        : null;

      const paging = new CursorPaging<GroupListItemDto, number>(
        groupListItems,
        nextCursor
      );

      return Result.ok(paging);
    } catch (error) {
      console.error("Error getting group list:", error);
      return Result.fail(500, "FAILED_TO_GET_GROUP_LIST");
    }
  }
}
