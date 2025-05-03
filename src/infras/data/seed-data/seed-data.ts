import "reflect-metadata";

import "dotenv/config";

import AppDataSource from "../data-source/data-source";
import { GenderType, User } from "../../../core/entities/user.entity";
import {
  Member,
  MemberRole,
  MemberStatusType,
} from "../../../core/entities/member.entity";
import {
  Message,
  MessageType,
  MessageStatus,
} from "../../../core/entities/message.entity";
import { Token } from "../../../core/entities/token.entity";
import {
  GroupChat,
  GroupChatStatusType,
  GroupChatType,
  GroupPrivacyType,
} from "../../../core/entities/group-chat.entity";

// Khởi tạo DataSource

export default async function seed() {
  // Seed Users
  await AppDataSource.initialize();
  const userRepository = AppDataSource.getRepository(User);
  const users = [
    {
      userId: 2720,
      phone: "084294363",
      password: "084294363",
      gender: GenderType.Female,
      fullName: "lam chym to 1",
      userName: "dasdaaasd",
      country: "Vietnam",
      isActive: true,
    },
    {
      userId: 2721,
      phone: "0842943637",
      password: "0842943637",
      gender: GenderType.Female,
      fullName: "lam chym to 2",
      userName: "wfdasdasd",
      country: "Vietnam",
      isActive: true,
    },
    {
      userId: 2723,
      email: "dagxuanlam@gmail.com",
      phone: "091918073",
      password: "123456Aa.",
      birthday: new Date("2005-01-01"),
      gender: GenderType.Male,
      avatar: "51c19099-94bb-4ea6-96f4-9017ad155694.jpeg",
      fullName: "Đặng Lâm",
      bio: "test 1 test 2  3  3 5",
      userName: "visaotoilagay",
      country: "Vietnam",
      isActive: true,
      googleAccountId: "104926606262337339168",
    },
  ];

  await userRepository.save(users);

  // Seed GroupChats
  const groupChatRepository = AppDataSource.getRepository(GroupChat);
  const groupChats = [
    {
      groupId: 96,
      name: "ahihi",
      createAt: new Date("2024-01-08 07:12:47"),
      groupChatStatus: GroupChatStatusType.Active,
      groupType: GroupChatType.Group,
      groupPrivacyType: GroupPrivacyType.Private,
      room: "96_group",
    },
    {
      groupId: 97,
      name: "INVIDIAL",
      createAt: new Date("2024-01-11 14:43:56"),
      groupChatStatus: GroupChatStatusType.Active,
      groupType: GroupChatType.Group,
      groupPrivacyType: GroupPrivacyType.Private,
      room: "97_group",
    },
  ];

  await groupChatRepository.save(groupChats);

  // Seed Members
  const memberRepository = AppDataSource.getRepository(Member);
  const members = [
    {
      memberId: 112,
      groupId: 96,
      userId: 2723,
      role: MemberRole.Creator,
      status: MemberStatusType.Active,
      timeJoin: new Date("2024-01-08 07:12:47"),
      nickName: "lam chym to 4",
    },
    {
      memberId: 113,
      groupId: 96,
      userId: 2721,
      role: MemberRole.Member,
      status: MemberStatusType.Active,
      timeJoin: new Date("2024-01-08 07:12:47"),
      nickName: "lam chym to 2",
    },
  ];

  await memberRepository.save(members);

  // Seed Messages
  const messageRepository = AppDataSource.getRepository(Message);
  const messages = [
    {
      messageId: 193,
      content: "created group",
      createAt: new Date("2024-01-08 14:12:48"),
      type: MessageType.Notification,
      status: MessageStatus.Normal,
      isPin: false,
      memberId: 112,
    },
    {
      messageId: 194,
      content: "added member {{@}} {{@}}  {{@}}",
      createAt: new Date("2024-01-08 14:12:48"),
      type: MessageType.Notification,
      status: MessageStatus.Normal,
      isPin: false,
      memberId: 112,
    },
  ];

  await messageRepository.save(messages);

  // Seed Tokens
  const tokenRepository = AppDataSource.getRepository(Token);
  const tokens = [
    {
      id: 1,
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresAt: new Date("2025-05-10 09:47:44"),
      userId: 2721,
      notificationToken: "",
      deviceInformation: "Apidog/1.0.0 (https://apidog.com)",
    },
    {
      id: 22,
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresAt: new Date("2025-05-16 02:43:06"),
      userId: 2723,
      notificationToken: "",
      deviceInformation: "Mozilla/5.0 (X11; Linux x86_64)...",
    },
  ];

  await tokenRepository.save(tokens);

  console.log("✅ Seed data completed!");
}

seed().catch((error) => console.error("Seed error:", error));
