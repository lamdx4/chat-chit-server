// manipulate-member.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  Unique,
  JoinColumn,
} from "typeorm";
import { Message } from "./message.entity";
import { Member } from "./member.entity";

@Entity({ name: "ManipulateMember" })
@Index("messageId", ["messageId"])
@Index("Member", ["memberId"])
@Unique(["memberId", "messageId"]) // Ràng buộc UNIQUE (memberId, messageId)
export class ManipulateMember {
  @PrimaryGeneratedColumn({ name: "manipulateId" })
  manipulateId: number;

  @Column({ name: "messageId" })
  messageId: number;

  @Column({ name: "memberId" })
  memberId: number;

  @ManyToOne(() => Message, (message) => message.manipulateMembers, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "messageId" })
  message: Message;

  @ManyToOne(() => Member, (member) => member.manipulateMembers, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "memberId" })
  member: Member;
}
