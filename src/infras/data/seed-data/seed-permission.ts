import { EntityManager } from "typeorm";
import { Permission } from "../../../core/entities/permission.entity";
import {
  GroupRole,
  MemberRole,
} from "../../../core/entities/group-role.entity";

const defaultPermissions = [
  { name: "manage_group_info", description: "Manage group information" },
  { name: "delete_group", description: "Delete the group" },
  {
    name: "change_group_privacy",
    description: "Change group privacy, name, and avatar",
  },
  { name: "manage_group_link", description: "Manage group invite link" },
  { name: "change_group_type", description: "Change group type" },
  { name: "view_group_insights", description: "View group insights" },

  { name: "add_member", description: "Add a member to the group" },
  { name: "approve_join_request", description: "Approve join requests" },
  { name: "block_member", description: "Block a member from the group" },
  { name: "remove_member", description: "Remove a member from the group" },
  { name: "ban_member", description: "Ban a member from the group" },
  { name: "assign_role", description: "Assign a role to a member" },
  { name: "assign_permission", description: "Assign a permission to a member" },
  { name: "remove_role", description: "Remove a role from a member" },
  { name: "view_members", description: "View group members" },
  { name: "edit_member_nickname", description: "Edit a member's nickname" },
  { name: "edit_own_nickname", description: "Edit own nickname" },

  { name: "send_message", description: "Send a message in the group" },
  {
    name: "delete_any_message",
    description: "Delete any message in the group",
  },
  { name: "delete_own_message", description: "Delete own message" },
  { name: "pin_message", description: "Pin a message in the group" },
  { name: "mention_all", description: "Mention all members" },
  { name: "send_poll", description: "Send a poll" },
  { name: "send_contact", description: "Send a contact" },

  { name: "create_and_close_poll", description: "Create and close polls" },
  { name: "vote_poll", description: "Vote in a poll" },
  { name: "view_poll_results", description: "View poll results" },
];

export function createRolePermissionForAdmin(manager: EntityManager) {
  return manager.getRepository(GroupRole).create({
    name: MemberRole.Admin,
    permissions: [
      { name: "view_members", description: "View group members" },
      { name: "manage_group_info", description: "Manage group information" },
      { name: "add_member", description: "Add a member to the group" },
      {
        name: "remove_member",
        description: "Remove a member from the group",
      },
      { name: "ban_member", description: "Ban a member from the group" },
      { name: "pin_message", description: "Pin a message in the group" },
      { name: "delete_own_message", description: "Delete own message" },
      { name: "create_poll", description: "Create a poll" },
      { name: "close_poll", description: "Close a poll" },
    ],
  });
}

export function createRolePermissionForMember(manager: EntityManager) {
  return manager.getRepository(GroupRole).create({
    name: MemberRole.Member,
    permissions: [
      { name: "view_members", description: "View group members" },
      { name: "add_member", description: "Add a member to the group" },
      { name: "send_message", description: "Send a message" },
      { name: "vote_poll", description: "Vote in a poll" },
      { name: "add_reaction", description: "Add a reaction to a message" },
      { name: "delete_own_message", description: "Delete own message" },
      { name: "remove_own_reaction", description: "Remove own reaction" },
      { name: "edit_own_nickname", description: "Edit own nickname" },
    ],
  });
}

export async function seedPermissionsForGroup(manager: EntityManager) {
  await manager.transaction(async (manager) => {
    for (const { name, description } of defaultPermissions) {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Permission)
        .values({ name, description })
        .orIgnore()
        .execute();
    }
  });
}
