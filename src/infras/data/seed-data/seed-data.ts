import "reflect-metadata";
import "dotenv/config";
import { fakerVI as faker } from "@faker-js/faker";
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

export default async function seed() {
  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    // Seed Users
    const users = [
      {
        userId: 1,
        phone: "084294363",
        password: "084294363",
        email: undefined,
        gender: GenderType.Female,
        fullName: "lam chym to 1",
        userName: "dasdaaasd",
        country: "Vietnam",
        isActive: true,
      },
      {
        userId: 2,
        phone: "0842943637",
        password: "0842943637",
        gender: GenderType.Female,
        fullName: "lam chym to 2",
        userName: "wfdasdasd",
        country: "Vietnam",
        isActive: true,
      },
      {
        userId: 3,
        phone: "091918073",
        password: "123456Aa.",
        birthday: new Date("2005-01-01"),
        gender: GenderType.Male,
        fullName: "Đặng Lâm",
        bio: "test 1 test 2  3  3 5",
        userName: "visaotoilagay",
        country: "Vietnam",
        isActive: true,
      },
    ];

    // Thêm user fake
    for (let i = 4; i <= 1000; i++) {
      users.push({
        userId: i,
        phone: faker.phone.number(),
        password: faker.internet.password(),
        gender: faker.helpers.arrayElement([
          GenderType.Male,
          GenderType.Female,
        ]),
        fullName: faker.person.fullName(),
        userName: faker.internet.username() + i,
        country: faker.location.country(),
        isActive: true,
        birthday: faker.date.birthdate(),
        bio: faker.lorem.sentence(),
      });
    }

    await manager.getRepository(User).save(users);

    // Seed GroupChats
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
        role: MemberRole.Creator,
        status: MemberStatusType.Active,
        timeJoin: new Date("2024-01-08 07:12:47"),
        nickName: "lam chym to 4",
      },
      {
        memberId: 2,
        groupId: 1,
        userId: 2,
        role: MemberRole.Member,
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
  });

  console.log("✅ Seed data completed!");
}

seed().catch((error) => console.error("Seed error:", error));
