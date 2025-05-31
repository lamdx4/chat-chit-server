import { v6 } from "uuid";
import { EntityManager, In } from "typeorm";
import {
  GroupChat,
  GroupChatType,
  GroupPrivacyType,
} from "../../../core/entities/group-chat.entity";
import { Member, MemberStatusType } from "../../../core/entities/member.entity";
import CreateGroupRequest from "../../../web/controllers/group/reqs/create-group.request";
import { BaseRepository } from "./base.repository";
import UserRepository from "./user.repository";
import { User } from "../../../core/entities/user.entity";
import { UserGroupJoinMode } from "../../../core/entities/user-privacy.entity";
import {
  GroupRole,
  MemberRole,
} from "../../../core/entities/group-role.entity";
import { Permission } from "../../../core/entities/permission.entity";
import { Message, MessageType } from "../../../core/entities/message.entity";
import { GroupListItemDto } from "../../../application/group/dtos/group-list.dto";
import { ManipulateMember } from "../../../core/entities/manipulate-member.entity";

export default class GroupRepository extends BaseRepository<GroupChat> {
  private userRepository: UserRepository;
  constructor() {
    super(GroupChat);
    this.userRepository = new UserRepository();
  }

  async getMyListGroupByUserId(
    userId: number,
    cursor?: number,
    limit: number = 10
  ): Promise<GroupChat[]> {
    // Build query to get groups with latest message ID for sorting
    let queryBuilder = this.manager
      .createQueryBuilder(GroupChat, "group")
      .leftJoin("group.members", "member")
      .leftJoin("member.user", "user")
      .leftJoin(
        Message,
        "latestMessage",
        "latestMessage.memberId IN (SELECT m.memberId FROM Member m WHERE m.groupId = group.groupId)"
      )
      .select([
        "group.groupId",
        "group.name",
        "group.createAt",
        "group.groupChatStatus",
        "group.avatar",
        "group.groupType",
        "group.groupPrivacyType",
        "group.link",
        "MAX(latestMessage.messageId) as latestMessageId",
      ])
      .where("member.userId = :userId", { userId })
      .andWhere("member.status = :status", { status: MemberStatusType.Active })
      .groupBy(
        "group.groupId, group.name, group.createAt, group.groupChatStatus, group.avatar, group.groupType, group.groupPrivacyType, group.link"
      );

    // Apply cursor-based pagination if cursor is provided
    if (cursor) {
      queryBuilder = queryBuilder.having(
        "MAX(latestMessage.messageId) < :cursor",
        { cursor }
      );
    }

    // Order by latest message ID descending and apply limit
    const results = await queryBuilder
      .orderBy("MAX(latestMessage.messageId)", "DESC")
      .limit(limit + 1) // Fetch one extra for cursor pagination
      .getRawMany();

    if (results.length === 0) {
      return [];
    }

    // Get the full group entities with their members
    const groupIds = results.map((r) => r.group_groupId);

    const groups = await this.manager
      .createQueryBuilder(GroupChat, "group")
      .leftJoinAndSelect("group.members", "member")
      .where("group.groupId IN (:...groupIds)", { groupIds })
      .getMany();

    // Sort groups according to latestMessageId order and add latestMessageId
    const sortedGroups = groupIds
      .map((id) => {
        const group = groups.find((group) => group.groupId === id);
        if (group) {
          const result = results.find((r) => r.group_groupId === id);
          (group as any).latestMessageId = result?.latestMessageId;
        }
        return group;
      })
      .filter(Boolean) as GroupChat[];

    return sortedGroups;
  }

  async getLatestMessage(groupId: number): Promise<Message | null> {
    return await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoinAndSelect("message.ownerMemberId", "messageMember")
      .leftJoinAndSelect("messageMember.user", "messageUser")
      .where(
        "message.memberId IN (SELECT m.memberId FROM Member m WHERE m.groupId = :groupId)",
        { groupId }
      )
      .orderBy("message.messageId", "DESC")
      .limit(1)
      .getOne();
  }

  async getUnreadMessageCount(
    groupId: number,
    userId: number
  ): Promise<number> {
    // Get user's member record to find lastReadMessageId
    const member = await this.manager
      .createQueryBuilder(Member, "member")
      .where("member.groupId = :groupId AND member.userId = :userId", {
        groupId,
        userId,
      })
      .getOne();

    if (!member || !member.lastReadMessageId) {
      // If no lastReadMessageId, count all messages in group
      return await this.manager
        .createQueryBuilder(Message, "message")
        .leftJoin("message.ownerMemberId", "messageMember")
        .where("messageMember.groupId = :groupId", { groupId })
        .getCount();
    }

    // Count messages newer than lastReadMessageId
    return await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoin("message.ownerMemberId", "messageMember")
      .where("messageMember.groupId = :groupId", { groupId })
      .andWhere("message.messageId > :lastReadMessageId", {
        lastReadMessageId: member.lastReadMessageId,
      })
      .getCount();
  }

  async createGroup(userId: number, groupData: CreateGroupRequest) {
    return this.manager.transaction(async (transactionalEntityManager) => {
      // 1. Tạo group
      let group = this.create({
        name: groupData.name,
        createAt: new Date(),
        groupType: GroupChatType.Group,
        groupPrivacyType: GroupPrivacyType.Public,
      });

      group = await transactionalEntityManager.save(group);

      console.log("Group created:", group);

      // 2. Tạo các role mặc định gắn với groupId
      const roles = [
        await this.createDefaultRolePermissionForAdmin(
          group.groupId,
          transactionalEntityManager
        ),
        await this.createDefaultRolePermissionForMember(
          group.groupId,
          transactionalEntityManager
        ),
        await this.createDefaultRolePermissionForOwner(
          group.groupId,
          transactionalEntityManager
        ),
      ];
      await transactionalEntityManager.getRepository(GroupRole).save(roles);

      console.log("Roles created:", roles);

      // 3. Thêm thành viên vào group
      const userWithPrivacy = await transactionalEntityManager
        .getRepository(User)
        .find({
          where: {
            userId: In(groupData.members),
          },
          relations: {
            userPrivacy: true,
          },
        });

      const members = groupData.members.map((_userId) => {
        return transactionalEntityManager.getRepository(Member).create({
          groupId: group.groupId,
          userId: _userId,
          nickName: v6(),
          roleId: roles.find((role) => role.name === MemberRole.Member)?.roleId, // Gán role Owner cho người tạo
          status:
            userWithPrivacy.find((u) => u.userId === _userId)?.userPrivacy
              .groupJoinMode === UserGroupJoinMode.AutoJoinForFriends
              ? MemberStatusType.Active
              : MemberStatusType.Invited,
        });
      });

      members.push(
        transactionalEntityManager.getRepository(Member).create({
          groupId: group.groupId,
          userId: userId,
          nickName: v6(),
          status: MemberStatusType.Active,
          roleId: roles.find((role) => role.name === MemberRole.Owner)?.roleId, // Gán role Owner cho người tạo
        })
      );

      const _members = await transactionalEntityManager
        .getRepository(Member)
        .save(members);

      // add message as notification for all members
      // 4. Tạo message thông báo cho tất cả thành viên
      const manipulateMembers: ManipulateMember[] = [];

      let strMessage = "{{@}} created group chat with";
      manipulateMembers.push(
        transactionalEntityManager.getRepository(ManipulateMember).create({
          memberId: _members.find((m) => m.userId === userId)?.memberId,
        })
      );

      manipulateMembers.push(
        ...groupData.members.map((_userId) => {
          strMessage += " {{@}}";
          return transactionalEntityManager
            .getRepository(ManipulateMember)
            .create({
              memberId: _members.find((m) => m.userId === _userId)?.memberId,
            });
        })
      );

      const message = transactionalEntityManager.getRepository(Message).create({
        content: strMessage,
        type: MessageType.Notification,
        manipulateMembers: manipulateMembers,
      });

      // Lưu message vào CSDL
      await transactionalEntityManager.save(message);

      // 4. Trả về group được tạo
      return transactionalEntityManager.getRepository(GroupChat).findOne({
        where: { groupId: group.groupId },
      });
    });
  }

  private async createDefaultRolePermissionForAdmin(
    groupId: number,
    transactionalEntityManager: EntityManager
  ) {
    const permissions = await transactionalEntityManager
      .getRepository(Permission)
      .find({
        where: {
          name: In([
            "view_members",
            "manage_group_info",
            "add_member",
            "remove_member",
            "ban_member",
            "pin_message",
            "delete_own_message",
            "create_poll",
            "close_poll",
          ]),
        },
      });

    return transactionalEntityManager.getRepository(GroupRole).create({
      name: MemberRole.Admin,
      groupId, // Gắn groupId
      permissions, // Gán danh sách quyền đã lấy từ CSDL
    });
  }

  private async createDefaultRolePermissionForMember(
    groupId: number,
    transactionalEntityManager: EntityManager
  ) {
    const permissions = await transactionalEntityManager
      .getRepository(Permission)
      .find({
        where: {
          name: In([
            "view_members",
            "add_member",
            "send_message",
            "vote_poll",
            "add_reaction",
            "delete_own_message",
            "remove_own_reaction",
            "edit_own_nickname",
          ]),
        },
      });

    return transactionalEntityManager.getRepository(GroupRole).create({
      name: MemberRole.Member,
      groupId, // Gắn groupId
      permissions, // Gán danh sách quyền đã lấy từ CSDL
    });
  }

  private async createDefaultRolePermissionForOwner(
    groupId: number,
    transactionalEntityManager: EntityManager
  ) {
    const permissions = await transactionalEntityManager
      .getRepository(Permission)
      .find({
        where: {
          name: In([
            "manage_group_info",
            "delete_group",
            "change_group_privacy",
            "manage_group_link",
            "change_group_type",
            "view_group_insights",
            "add_member",
            "approve_join_request",
            "block_member",
            "remove_member",
            "ban_member",
            "assign_role",
            "assign_permission",
            "remove_role",
            "view_members",
            "edit_member_nickname",
            "edit_own_nickname",
            "send_message",
            "delete_any_message",
            "delete_own_message",
            "pin_message",
            "mention_all",
            "send_poll",
            "send_contact",
            "create_and_close_poll",
            "vote_poll",
            "view_poll_results",
          ]),
        },
      });

    return transactionalEntityManager.getRepository(GroupRole).create({
      name: MemberRole.Owner,
      groupId, // Gắn groupId
      permissions, // Gán danh sách quyền đã lấy từ CSDL
    });
  }

  async getLatestMessageId(groupId: number): Promise<number | null> {
    const result = await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoin("message.ownerMemberId", "messageMember")
      .select("MAX(message.messageId)", "latestMessageId")
      .where("messageMember.groupId = :groupId", { groupId })
      .getRawOne();

    return result?.latestMessageId || null;
  }
}
