import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  OneToOne,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Member } from "./member.entity";
import { Reaction } from "./reaction.entity";
import { File } from "./file.entity";
import { Poll } from "./poll.entity";

export enum MessageType {
  Text = "Text",
  Gif = "Gif",
  File = "File",
  Notification = "Notification",
  Contact = "Contact",
  Poll = "Poll"
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

  @Column({ length: 250 })
  content: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "enum", enum: MessageType })
  type: MessageType;

  @Column({ type: "enum", enum: MessageStatus, default: MessageStatus.Normal })
  status: MessageStatus;

  @Column({ nullable: true })
  replyMessageId?: number;

  @Column("tinyint", { default: 0 })
  isPin: boolean;

  @Column()
  memberId: number;

  @ManyToOne(() => Member, (member) => member.messages, {
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "memberId" })
  ownerMember?: Member;

  @OneToOne(() => Message, {})
  @JoinColumn({ name: "replyMessageId" })
  replyMessage?: Message;

  @OneToMany(() => Reaction, (reaction) => reaction.message, { eager: true })
  reactions: Reaction[];

  @ManyToMany(() => Member, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "ManipulateMember",
    joinColumn: {
      name: "messageId",
      referencedColumnName: "messageId",
    },
    inverseJoinColumn: {
      name: "memberId",
      referencedColumnName: "memberId",
    },
  })
  manipulateMembers: Member[];

  @OneToOne(() => Poll, (poll) => poll.message, { eager: true, cascade: true })
  poll: Poll;

  @ManyToMany(() => File, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "MessageFiles",
    joinColumn: {
      name: "messageId",
      referencedColumnName: "messageId",
    },
    inverseJoinColumn: {
      name: "fileId",
      referencedColumnName: "fileId",
    },
  })
  files: File[];
}
