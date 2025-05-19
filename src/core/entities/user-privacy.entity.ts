import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

export enum UserGroupJoinMode {
  AutoJoinForFriends = "AutoJoinForFriends",
  InviteOnly = "InviteOnly",
}

export enum PhoneVisibility {
  Everyone = "Everyone", // Ai cũng có thể tìm thấy qua số điện thoại
  FriendsOnly = "FriendsOnly", // Chỉ bạn bè mới có thể tìm thấy
  OnlyMe = "OnlyMe", // Chỉ bản thân bạn mới có thể tìm thấy
}

export enum MessagingPermission {
  Everyone = "Everyone", // Ai cũng có thể nhắn tin
  FriendsOnly = "FriendsOnly", // Chỉ bạn bè được nhắn tin
}

export enum BirthdayVisibility {
  Everyone = "Everyone", // Ai cũng có thể xem ngày sinh
  FriendsOnly = "FriendsOnly", // Chỉ bạn bè mới có thể xem ngày sinh
  OnlyMe = "OnlyMe", // Chỉ bản thân bạn mới có thể xem ngày sinh
}

@Entity({ name: "UserPrivacy" })
export class UserPrivacy {
  @PrimaryColumn()
  userId: number;

  @Column({
    type: "enum",
    enum: UserGroupJoinMode,
    default: UserGroupJoinMode.InviteOnly,
  })
  groupJoinMode: UserGroupJoinMode;

  @Column({
    type: "enum",
    enum: PhoneVisibility,
    default: PhoneVisibility.Everyone,
  })
  phoneVisibility: PhoneVisibility;

  @Column({
    type: "enum",
    enum: BirthdayVisibility,
    default: BirthdayVisibility.Everyone,
  })
  birthdayVisibility: BirthdayVisibility;

  @Column({
    type: "bool",
    default: true,
  })
  findByPhone: boolean;

  @Column({
    type: "enum",
    enum: MessagingPermission,
    default: MessagingPermission.FriendsOnly,
  })
  messagingPermission: MessagingPermission;

  @OneToOne(() => User, (user) => user.userPrivacy)
  @JoinColumn({ name: "userId" })
  user: User;
}
