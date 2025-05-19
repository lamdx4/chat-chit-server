import { Faker } from "@faker-js/faker/.";
import { EntityManager } from "typeorm";
import {
  GroupChatStatusType,
  GroupChatType,
  GroupPrivacyType,
  GroupChat,
} from "../../../core/entities/group-chat.entity";
import { MemberStatusType, Member } from "../../../core/entities/member.entity";
import {
  MessageType,
  MessageStatus,
  Message,
} from "../../../core/entities/message.entity";

export default async function seedGroup(manager: EntityManager, faker: Faker) {
  const groupChats = [
    {
      groupId: 1,
      name: "ahihi",
      createAt: new Date("2024-01-08 07:12:47"),
      groupChatStatus: GroupChatStatusType.Active,
      groupType: GroupChatType.Group,
      groupPrivacyType: GroupPrivacyType.Private,
      room: "1_group",
    },
    {
      groupId: 2,
      name: "INVIDIAL",
      createAt: new Date("2024-01-11 14:43:56"),
      groupChatStatus: GroupChatStatusType.Active,
      groupType: GroupChatType.Group,
      groupPrivacyType: GroupPrivacyType.Private,
      room: "2_group",
    },
  ];

  await manager.getRepository(GroupChat).save(groupChats);

  // Seed Members
  const members = [
    {
      memberId: 1,
      groupId: 1,
      userId: 3,
      status: MemberStatusType.Active,
      timeJoin: new Date("2024-01-08 07:12:47"),
      nickName: "lam chym to 4",
    },
    {
      memberId: 2,
      groupId: 1,
      userId: 2,
      status: MemberStatusType.Active,
      timeJoin: new Date("2024-01-08 07:12:47"),
      nickName: "lam chym to 2",
    },
  ];

  await manager.getRepository(Member).save(members);

  // Seed Messages
  const messages = [
    {
      messageId: 1,
      content: "created group",
      createAt: new Date("2024-01-08 14:12:48"),
      type: MessageType.Notification,
      status: MessageStatus.Normal,
      isPin: false,
      memberId: 1,
    },
    {
      messageId: 2,
      content: "added member {{@}} {{@}}  {{@}}",
      createAt: new Date("2024-01-08 14:12:48"),
      type: MessageType.Notification,
      status: MessageStatus.Normal,
      isPin: false,
      memberId: 1,
    },
  ];

  await manager.getRepository(Message).save(messages);
}
