// member.entity.ts (Đã hoàn thiện)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  Unique,
} from "typeorm";
import { GroupChat } from "./group-chat.entity";
import { User } from "./user.entity";
import { Message } from "./message.entity";
import { ManipulateMember } from "./manipulate-member.entity";
import { Reaction } from "./reaction.entity";
import { GroupRole } from "./group-role.entity";


export enum MemberStatusType {
  Invited = "Invited",
  AdminApprovalPending = "AdminApprovalPending",
  Active = "Active",
  Left = "Left",
  Banned = "Banned",
}

@Entity({ name: "Member" })
@Index("IX_Member_GroupId", ["groupId"])
@Index("IX_Member_UserId", ["userId"])
@Index("IX_Member_LastReadMessageId", ["lastReadMessageId"])
@Unique("UQ_Member_GroupId_UserId", ["groupId", "userId"])
export class Member {
  @PrimaryGeneratedColumn({ name: "memberId" })
  memberId: number;

  @Column({ name: "groupId" })
  groupId: number;

  @Column({ name: "userId" })
  userId: number;

  @Column({
    name: "lastReadMessageId",
    nullable: true,
  })
  lastReadMessageId?: number;

  @Column({
    name: "lastReceivedMessageId",
    nullable: true,
  })
  lastReceivedMessageId?: number;

  // @Column({
  //   name: "role",
  //   type: "enum",
  //   enum: MemberRole,
  //   default: MemberRole.Member,
  // })
  // role: MemberRole;

  @Column({ name: "roleId" })
  roleId: number;

  @ManyToOne(() => GroupRole, { cascade: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "roleId" })
  role: GroupRole;

  @Column({
    name: "status",
    type: "enum",
    enum: MemberStatusType,
    default: MemberStatusType.Active,
  })
  status: MemberStatusType;

  @Column({
    name: "timeJoin",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP()",
  })
  timeJoin: Date;

  @Column({
    name: "nickName",
    length: 36,
  })
  nickName: string;

  // Quan hệ
  @ManyToOne(() => GroupChat, (group) => group.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "groupId" })
  group: GroupChat;

  @ManyToOne(() => User, (user) => user.members)
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Message)
  @JoinColumn({ name: "lastReadMessageId" })
  lastReadMessage?: Message;

  @ManyToOne(() => Message)
  @JoinColumn({ name: "lastReceivedMessageId" })
  lastReceivedMessage?: Message;

  @OneToMany(
    () => ManipulateMember,
    (manipulateMember) => manipulateMember.member
  )
  manipulateMembers: ManipulateMember[];

  @OneToMany(() => Message, (message) => message.ownerMemberId)
  messages: Message[];

  @OneToMany(() => Reaction, (reaction) => reaction.member)
  reactions: Reaction[];
}
