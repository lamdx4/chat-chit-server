import { v4, v6 } from "uuid";
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
import {
  Message,
  MessageStatus,
  MessageType,
} from "../../../core/entities/message.entity";
import { File } from "../../../core/entities/file.entity";

export default class GroupRepository extends BaseRepository<GroupChat> {
  private userRepository: UserRepository;
  constructor() {
    super(GroupChat);
    this.userRepository = new UserRepository();
  }

  async addMemberToGroup(groupId: number, friendIds: number[]) {
    const members: Member[] = [];
    const roles = await this.manager.getRepository(GroupRole).find({
      where: { groupId },
    });
    for (const _userId of friendIds) {
      members.push(
        this.manager.getRepository(Member).create({
          groupId: groupId,
          userId: _userId,
          roleId: roles.find((role) => role.name === MemberRole.Member)?.roleId, // Gán role Owner cho người tạo
          //FIXME: status mặc định là Active, sau này có thể thay đổi theo logic
          // status:
          //   userWithPrivacy.find((u) => u.userId === _userId)?.userPrivacy
          //     .groupJoinMode === UserGroupJoinMode.AutoJoinForFriends
          //     ? MemberStatusType.Active
          //     : MemberStatusType.Invited,
        })
      );
    }
    await this.manager.getRepository(Member).save(members);
    return true;
  }

  async changeEmojiGroup(groupId: number, emoji: string) {
    const group = await this.manager.getRepository(GroupChat).findOne({
      where: { groupId },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    group.emoji = emoji;
    await this.manager.getRepository(GroupChat).save(group);
    return true;
  }

  async viewNewMessage(latestMessageId: number, memberId: number) {
    // Lấy thông tin thành viên trong nhóm
    const member = await this.manager.getRepository(Member).findOne({
      where: { memberId },
    });

    // Cập nhật lastReadMessageId cho thành viên
    member!.lastReadMessageId = latestMessageId; // Hoặc có thể để là ID của message mới nhất nếu cần
    await this.manager.getRepository(Member).save(member!);

    return true;
  }

  async getMemberInfo(groupId: number, memberId: number, userId: number) {
    return this.manager.getRepository(Member).findOne({
      where: { groupId, memberId, userId },
      relations: ["user"],
    });
  }

  async changeGroupAvatar(
    groupId: number,
    key: string,
    mimeType: string
  ): Promise<boolean> {
    return this.manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        // Tìm kiếm nhóm theo groupId
        const group = await transactionalEntityManager
          .getRepository(GroupChat)
          .findOne({
            where: { groupId },
          });

        if (!group) {
          throw new Error("Group not found");
        }

        await transactionalEntityManager.getRepository(File).save({
          fileId: key,
          mimeType: mimeType, // Hoặc loại MIME phù hợp với ảnh
        });

        // Cập nhật avatar của nhóm
        group.avatar = key;
        await transactionalEntityManager.getRepository(GroupChat).save(group);

        return true;
      }
    );
  }

  async renameGroup(groupId: number, name: string): Promise<boolean> {
    try {
      const group = await this.manager.getRepository(GroupChat).findOne({
        where: { groupId },
      });
      if (!group) {
        throw new Error("Group not found");
      }
      group.name = name;
      await this.manager.getRepository(GroupChat).save(group);
      return true;
    } catch (error) {
      console.error("Error renaming group:", error);
      return false;
    }
  }

  async getSearchMemberFromGroup(
    groupId: number,
    searchTerm: string,
    limit: number
  ) {
    const members = await this.manager
      .createQueryBuilder(Member, "member")
      .leftJoinAndSelect("member.user", "user")
      .where("member.groupId = :groupId", { groupId })
      .andWhere("member.status = :status", { status: MemberStatusType.Active })
      .andWhere(
        "(member.nickName LIKE :searchTerm OR user.fullName LIKE :searchTerm)",
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy("user.fullName", "ASC")
      .take(limit)
      .getMany();
    return members;
  }
  /**
   * Find a direct message group between two users
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns Promise<GroupChat | null> - The direct message group if exists, null otherwise
   */
  async findDirectMessageGroup(
    userId1: number,
    userId2: number
  ): Promise<GroupChat | null> {
    // Find groups where:
    // 1. Group type is Direct
    // 2. Has exactly 2 active members
    // 3. Those 2 members are userId1 and userId2
    const directGroup = await this.manager
      .createQueryBuilder(GroupChat, "group")
      .innerJoin("group.members", "member")
      .where("group.groupType = :groupType", {
        groupType: GroupChatType.Direct,
      })
      .andWhere("member.status = :status", { status: MemberStatusType.Active })
      .andWhere("member.userId IN (:...userIds)", {
        userIds: [userId1, userId2],
      })
      .groupBy("group.groupId")
      .having("COUNT(DISTINCT member.userId) = 2")
      .having("COUNT(member.memberId) = 2") // Ensure exactly 2 members total
      .getOne();

    // Double check that the group contains exactly the two users we want
    if (directGroup) {
      const members = await this.manager
        .createQueryBuilder(Member, "member")
        .where("member.groupId = :groupId", { groupId: directGroup.groupId })
        .andWhere("member.status = :status", {
          status: MemberStatusType.Active,
        })
        .getMany();

      const memberUserIds = members.map((m) => m.userId).sort();
      const targetUserIds = [userId1, userId2].sort();

      // Verify that the members are exactly the two users we're looking for
      if (
        memberUserIds.length === 2 &&
        memberUserIds[0] === targetUserIds[0] &&
        memberUserIds[1] === targetUserIds[1]
      ) {
        return directGroup;
      }
    }

    return null;
  }

  /**
   * Create a direct message group between two users
   * @param userId1 - The ID of the first user
   * @param userId2 - The ID of the second user
   * @returns Promise<GroupChat> - The created direct message group
   */
  async createDirectMessageGroup(
    userId1: number,
    userId2: number
  ): Promise<GroupChat> {
    return this.manager.transaction(async (transactionalEntityManager) => {
      // 1. Create the direct message group
      let group = this.create({
        name: "Direct Message", // Default name for direct messages
        createAt: new Date(),
        groupType: GroupChatType.Direct,
        groupPrivacyType: GroupPrivacyType.Private,
        link: v4(),
      });

      group = await transactionalEntityManager.save(group);

      // 2. Create default roles for direct message
      const memberRole = transactionalEntityManager
        .getRepository(GroupRole)
        .create({
          name: MemberRole.Member,
          groupId: group.groupId,
          permissions: [], // Direct messages don't need complex permissions
        });

      await transactionalEntityManager
        .getRepository(GroupRole)
        .save(memberRole);

      // 3. Add both users as members
      const members = [
        transactionalEntityManager.getRepository(Member).create({
          groupId: group.groupId,
          userId: userId1,
          nickName: v6(),
          roleId: memberRole.roleId,
          status: MemberStatusType.Active,
        }),
        transactionalEntityManager.getRepository(Member).create({
          groupId: group.groupId,
          userId: userId2,
          nickName: v6(),
          roleId: memberRole.roleId,
          status: MemberStatusType.Active,
        }),
      ];

      await transactionalEntityManager.getRepository(Member).save(members);

      // 4. Return the created group
      return transactionalEntityManager.getRepository(GroupChat).findOne({
        where: { groupId: group.groupId },
      }) as Promise<GroupChat>;
    });
  }

  async getMyListGroupByUserId(
    userId: number,
    cursor?: number,
    limit: number = 10
  ): Promise<GroupChat[]> {
    const queryBuilder = this.createQueryBuilder("group")
      .innerJoin("group.members", "member")
      .addSelect((qb) => {
        return qb
          .select("COALESCE(MAX(m.messageId), 0)")
          .from(Message, "m")
          .innerJoin("m.ownerMember", "mem")
          .where("mem.groupId = group.groupId")
          .andWhere("m.status = :messageStatus");
      }, "latestMessageId")
      .where("member.userId = :userId")
      .andWhere("member.status = :status")
      .setParameters({
        userId,
        status: MemberStatusType.Active,
        messageStatus: MessageStatus.Normal,
      });

    if (cursor) {
      queryBuilder.andHaving("latestMessageId < :cursor", { cursor });
    }

    return await queryBuilder
      .orderBy("latestMessageId", "DESC")
      .limit(limit + 1)
      .getMany();
  }

  async getGroupById(groupId: number): Promise<GroupChat | null> {
    const data = await this.manager.getRepository(GroupChat).findOne({
      where: { groupId },
      order: {
        members: {
          timeJoin: "ASC",
        },
      },
    });
    return data ? data : null;
  }

  async searchMembersInGroup(
    groupId: number,
    searchTerm: string,
    limit: number = 10
  ): Promise<Member[]> {
    return await this.manager.getRepository(Member).find({
      where: {
        groupId,
        user: {
          fullName: In([`%${searchTerm}%`]),
        },
      },
      relations: ["user"],
      take: limit,
      order: {
        user: {
          fullName: "ASC",
        },
      },
    });
  }

  async getListMembersOfGroup(groupId: number): Promise<Member[]> {
    return await this.manager.getRepository(Member).find({
      where: { groupId, status: MemberStatusType.Active },
      relations: ["user"],
    });
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
      // If no lastReadMessageId, count all messages in group where user is owner or mentioned
      return await this.manager
        .createQueryBuilder(Message, "message")
        .leftJoin("message.ownerMember", "messageMember")
        .leftJoin("message.manipulateMembers", "member")
        .where("messageMember.groupId = :groupId", { groupId })
        .andWhere(
          "(messageMember.userId = :userId OR member.userId = :userId)",
          { userId }
        )
        .getCount();
    }

    // Count messages newer than lastReadMessageId where user is owner or mentioned
    return await this.manager
      .createQueryBuilder(Message, "message")
      .leftJoin("message.ownerMember", "messageMember")
      .leftJoin("message.manipulateMembers", "member")
      .where("messageMember.groupId = :groupId", { groupId })
      .andWhere("(messageMember.userId = :userId OR member.userId = :userId)", {
        userId,
      })
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
        link: v4(),
      });

      group = await transactionalEntityManager.save(group);

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

      const members: Member[] = [];
      for (const _userId of groupData.members) {
        members.push(
          transactionalEntityManager.getRepository(Member).create({
            groupId: group.groupId,
            userId: _userId,
            roleId: roles.find((role) => role.name === MemberRole.Member)
              ?.roleId, // Gán role Owner cho người tạo
            //FIXME: status mặc định là Active, sau này có thể thay đổi theo logic
            // status:
            //   userWithPrivacy.find((u) => u.userId === _userId)?.userPrivacy
            //     .groupJoinMode === UserGroupJoinMode.AutoJoinForFriends
            //     ? MemberStatusType.Active
            //     : MemberStatusType.Invited,
          })
        );
      }
      members.push(
        transactionalEntityManager.getRepository(Member).create({
          groupId: group.groupId,
          userId: userId,
          status: MemberStatusType.Active,
          roleId: roles.find((role) => role.name === MemberRole.Owner)?.roleId, // Gán role Owner cho người tạo
        })
      );

      const _members = await transactionalEntityManager
        .getRepository(Member)
        .save(members);

      // add message as notification for all members
      // 4. Tạo message thông báo cho tất cả thành viên

      let strMessage = "{{@}} created group chat";

      const message = transactionalEntityManager.getRepository(Message).create({
        content: strMessage,
        type: MessageType.Notification,
        manipulateMembers: [
          {
            memberId: _members.find((m) => m.userId === userId)?.memberId,
          },
        ],
        memberId: _members.find((m) => m.userId === userId)?.memberId,
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

  async getCurrentMember(
    groupId: number,
    userId: number
  ): Promise<Member | null> {
    return await this.manager
      .createQueryBuilder(Member, "member")
      .leftJoinAndSelect("member.user", "user")
      .where("member.groupId = :groupId AND member.userId = :userId", {
        groupId,
        userId,
      })
      .getOne();
  }

  /**
   * Get the count of active members in a group
   * @param groupId - The ID of the group
   * @returns Promise<number> - Number of active members
   */
  async getMemberCount(groupId: number): Promise<number> {
    return await this.manager
      .createQueryBuilder(Member, "member")
      .where("member.groupId = :groupId", { groupId })
      .andWhere("member.status = :status", { status: MemberStatusType.Active })
      .getCount();
  }
}
