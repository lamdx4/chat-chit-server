// group-chat.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { GroupChatMemberPermission } from "./group-chat-member-permission.entity";
import { Member } from "./member.entity";

export enum GroupChatType {
  Personal = "Personal",
  Group = "Group",
}

export enum GroupChatStatusType {
  Active = "Active",
  Inactive = "Inactive",
  Deleted = "Deleted",
}

export enum GroupPrivacyType {
  Public = "Public",
  Private = "Private",
}

@Entity({ name: "GroupChat" })
@Index("IdGroup", ["groupId"])
export class GroupChat {
  @PrimaryGeneratedColumn({ name: "groupId" })
  groupId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "datetime" })
  createAt: Date;

  @Column({
    type: "enum",
    enum: GroupChatStatusType,
    default: GroupChatStatusType.Active,
  })
  groupChatStatus: GroupChatStatusType;

  @Column({ length: 30, nullable: true })
  avatar?: string;

  @Column({ type: "enum", enum: GroupChatType })
  groupType: GroupChatType;

  @Column({ type: "enum", enum: GroupPrivacyType })
  groupPrivacyType: GroupPrivacyType;

  @Column({ length: 12, nullable: true })
  link?: string;

  @Column({ length: 100 })
  room: string;

  @OneToMany(() => GroupChatMemberPermission, (perm) => perm.group)
  groupChatMemberPermissions: GroupChatMemberPermission[];

  @OneToMany(() => Member, (member) => member.group)
  members: Member[];
}
