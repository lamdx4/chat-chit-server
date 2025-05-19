// group-chat.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Member } from "./member.entity";
import { File } from "./file.entity";
import { GroupRole } from "./group-role.entity";
import { v6 } from "uuid";

export enum GroupChatType {
  Direct = "Direct",
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

  @Column({ type: "varchar", length: 100, nullable: false, default: v6() })
  @Index({ unique: true })
  link: string;

  @OneToMany(() => Member, (member) => member.group, { cascade: true })
  members: Member[];

  @OneToOne(() => File, (file) => file.groupAvatar)
  @JoinColumn({ name: "avatar" })
  avatarGroup: File;

  @OneToMany(() => GroupRole, (role) => role.group, { cascade: true })
  roles: GroupRole[];
}
