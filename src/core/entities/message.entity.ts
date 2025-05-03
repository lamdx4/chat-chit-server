import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { Member } from "./member.entity";
import { Reaction } from "./reaction.entity";
import { ManipulateMember } from "./manipulate-member.entity";

export enum MessageType {
  Text = "Text",
  Gif = "Gif",
  File = "File",
  Notification = "Notification",
  Contact = "Contact",
}

export enum MessageStatus {
  Normal = "Normal",
  DeletedByOwner = "DeletedByOwner",
  DeletedByAdmin = "DeletedByAdmin",
}

@Entity({ name: "Message" })
@Index("MemberId", ["memberId"])
@Index("ReplyIdMessage", ["replyMessageId"])
export class Message {
  @PrimaryGeneratedColumn({ name: "messageId" })
  messageId: number;

  @Column({ length: 100 })
  content: string;

  @Column({ type: "datetime" })
  createAt: Date;

  @Column({ type: "enum", enum: MessageType })
  type: MessageType;

  @Column({ type: "enum", enum: MessageStatus })
  status: MessageStatus;

  @Column({ nullable: true })
  replyMessageId?: number;

  @Column("tinyint", { default: 0 })
  isPin: boolean;

  @Column()
  memberId: number;

  @ManyToOne(() => Member, (member) => member.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "memberId" })
  ownerMemberId: Member;

  @ManyToOne(() => Message, (message) => message.inverseReplyMessage)
  @JoinColumn({ name: "replyMessageId" })
  replyMessage?: Message;

  @OneToMany(() => Message, (message) => message.replyMessage)
  inverseReplyMessage: Message[];

  @OneToMany(() => Reaction, (reaction) => reaction.message)
  reactions: Reaction[];

  @OneToMany(
    () => ManipulateMember,
    (manipulateMember) => manipulateMember.member
  )
  manipulateMembers: ManipulateMember[];
}
