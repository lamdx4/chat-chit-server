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

export default class GroupRepository extends BaseRepository<GroupChat> {
  private userRepository: UserRepository;
  constructor() {
    super(GroupChat);
    this.userRepository = new UserRepository();
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

      const members = groupData.members.map((userId) => {
        return transactionalEntityManager.getRepository(Member).create({
          groupId: group.groupId,
          userId: userId,
          nickName: v6(),
          roleId: roles.find((role) => role.name === MemberRole.Member)?.roleId, // Gán role Owner cho người tạo
          status:
            userWithPrivacy.find((u) => u.userId === userId)?.userPrivacy
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

      await transactionalEntityManager.getRepository(Member).save(members);

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
}
