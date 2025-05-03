// user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { Member } from "./member.entity";
import { Token } from "./token.entity";
import { Relationship } from "./relationship.entity";
import { Notification } from "./notification.entity";

export enum GenderType {
  Male = "Male",
  Female = "Female",
}

@Entity({ name: "User" })
@Index("Phone", ["phone"], { unique: true })
@Index("UserName", ["userName"], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ name: "userId" })
  userId: number;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ length: 15 })
  phone: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: "datetime", nullable: true })
  birthday?: Date;

  @Column({ type: "enum", enum: GenderType, default: GenderType.Male })
  gender: GenderType;

  @Column({ length: 50, nullable: true })
  avatar?: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 255, default: "" })
  bio: string;

  @Column({ length: 30 })
  userName: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  @Column({ nullable: true })
  googleAccountId?: string;

  @Column("tinyint", { default: 1 })
  isActive: boolean;

  @OneToMany(() => Member, (member) => member.user)
  members: Member[];

  @OneToMany(() => Token, (token) => token.user)
  tokens: Token[];

  @OneToMany(() => Relationship, (rel) => rel.requester)
  relationshipRequesters: Relationship[];

  @OneToMany(() => Relationship, (rel) => rel.addressee)
  relationshipAddressees: Relationship[];

  @OneToMany(() => Notification, (notification) => notification.owner)
  notifications: Notification[];
}
