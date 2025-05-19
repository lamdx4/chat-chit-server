// user.entity.ts
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
import { Token } from "./token.entity";
import { Relationship } from "./relationship.entity";
import { Notification } from "./notification.entity";
import { File } from "./file.entity";
import { UserPrivacy } from "./user-privacy.entity";

export enum GenderType {
  Male = "Male",
  Female = "Female",
}

@Entity({ name: "User" })
@Index("UQ_User_Phone", ["phone"], { unique: true })
@Index("UQ_User_UserName", ["userName"], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ name: "userId" })
  userId: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  email?: string | null;

  @Column({ length: 15 })
  phone: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: "datetime", nullable: true })
  birthday?: Date;

  @Column({ type: "enum", enum: GenderType, default: GenderType.Male })
  gender: GenderType;

  @Index()
  @Column({ type: "varchar", length: 100, nullable: true })
  avatar?: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 255, default: "" })
  bio: string;

  @Column({ length: 30 })
  userName: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  googleAccountId?: string | null;

  @Column("tinyint", { default: 1 })
  isActive: boolean;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @OneToMany(() => Member, (member) => member.user)
  members: Member[];

  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[];

  @OneToMany(() => Relationship, (rel) => rel.requester)
  relationshipRequesters: Relationship[];

  @OneToOne(() => File, (file) => file.userAvatar)
  @JoinColumn({ name: "avatar" })
  avatarFile: File;

  @OneToMany(() => Relationship, (rel) => rel.addressee)
  relationshipAddressees: Relationship[];

  @OneToMany(() => Notification, (notification) => notification.owner)
  notifications: Notification[];

  @OneToOne(() => UserPrivacy, (privacy) => privacy.user, { cascade: true })
  userPrivacy: UserPrivacy;
}
