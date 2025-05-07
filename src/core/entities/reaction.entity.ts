// reaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Message } from "./message.entity";
import { Member } from "./member.entity";

@Entity({ name: "Reaction" })
export class Reaction {
  @PrimaryGeneratedColumn({ name: "reactionId" })
  reactionId: number;

  @Index("MessageId")
  @Column()
  messageId: number;

  @Column()
  emojiData: string;

  @Column()
  memberId: number;

  @JoinColumn({ name: "memberId" })
  @ManyToOne(() => Member, (member) => member.reactions, {
    onDelete: "CASCADE",
  })
  member: Member;

  @ManyToOne(() => Message, (message) => message.reactions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "messageId" })
  message: Message;
}
