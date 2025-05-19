import { DeepPartial, EntityManager } from "typeorm";
import { GenderType, User } from "../../../core/entities/user.entity";
import { Faker } from "@faker-js/faker/.";
import {
  Relationship,
  RelationType,
} from "../../../core/entities/relationship.entity";
import {
  MessagingPermission,
  UserGroupJoinMode,
} from "../../../core/entities/user-privacy.entity";

export default async function seedUser(manager: EntityManager, faker: Faker) {
  const NUM_OF_USER = 10000;

  const users: DeepPartial<User>[] = [
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
      userPrivacy: {
        groupJoinMode: faker.helpers.arrayElement([
          UserGroupJoinMode.AutoJoinForFriends,
          UserGroupJoinMode.InviteOnly,
        ]),
        messagingPermission: faker.helpers.arrayElement([
          MessagingPermission.Everyone,
          MessagingPermission.FriendsOnly,
        ]),
      },
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
      userPrivacy: {
        groupJoinMode: faker.helpers.arrayElement([
          UserGroupJoinMode.AutoJoinForFriends,
          UserGroupJoinMode.InviteOnly,
        ]),
        messagingPermission: faker.helpers.arrayElement([
          MessagingPermission.Everyone,
          MessagingPermission.FriendsOnly,
        ]),
      },
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
      userPrivacy: {
        groupJoinMode: faker.helpers.arrayElement([
          UserGroupJoinMode.AutoJoinForFriends,
          UserGroupJoinMode.InviteOnly,
        ]),
        messagingPermission: faker.helpers.arrayElement([
          MessagingPermission.Everyone,
          MessagingPermission.FriendsOnly,
        ]),
      },
    },
  ];

  // Thêm user fake
  for (let i = 4; i <= NUM_OF_USER; i++) {
    users.push({
      userId: i,
      phone: faker.phone.number(),
      password: faker.internet.password(),
      gender: faker.helpers.arrayElement([GenderType.Male, GenderType.Female]),
      fullName: faker.person.fullName(),
      userName: faker.internet.username() + i,
      country: faker.location.country(),
      isActive: true,
      birthday: faker.date.birthdate(),
      bio: faker.lorem.sentence(),
      userPrivacy: {
        groupJoinMode: faker.helpers.arrayElement([
          UserGroupJoinMode.AutoJoinForFriends,
          UserGroupJoinMode.InviteOnly,
        ]),
        messagingPermission: faker.helpers.arrayElement([
          MessagingPermission.Everyone,
          MessagingPermission.FriendsOnly,
        ]),
      },
    });
  }

  await manager.getRepository(User).save(users);

  const userIds = [1, 2, 3];
  const seeds = [];
  for (let userId of userIds) {
    const userIdsHasBeenUsed: number[] = [];
    for (let i = 1; i < 1000; i++) {
      const userIdUsed = faker.helpers.arrayElement(users).userId!;

      if (!userIdsHasBeenUsed.includes(userIdUsed)) {
        userIdsHasBeenUsed.push(userIdUsed);
        if (Math.random() < 0.5) {
          seeds.push({
            requesterId: userId,
            addresseeId: userIdUsed,
            relationType: faker.helpers.arrayElement([
              RelationType.Block,
              RelationType.Friend,
              RelationType.Pending,
            ]),
          });
        } else {
          seeds.push({
            addresseeId: userId,
            requesterId: userIdUsed,
            relationType: faker.helpers.arrayElement([
              RelationType.Block,
              RelationType.Friend,
              RelationType.Pending,
            ]),
          });
        }
      } else {
        i--;
      }
    }
  }

  await manager.getRepository(Relationship).save(seeds);
}
