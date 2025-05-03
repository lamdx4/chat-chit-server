// reaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  OneToMany,
} from "typeorm";
import { Message } from "./message.entity";
import { Member } from "./member.entity";

@Entity({ name: "Reaction" })
@Index("MemberIdIndex", ["memberId"])
@Index("MessageIdIndex", ["messageId"])
export class Reaction {
  @PrimaryGeneratedColumn({ name: "reactionId" })
  reactionId: number;

  @Column()
  messageId: number;

  @Column()
  emojiData: string;

  @Column()
  memberId: number;

  @ManyToOne(() => Member, (member) => member.reactions, {
    onDelete: "CASCADE",
  })
  member: Member;

  @ManyToOne(() => Message, (message) => message.reactions, {
    onDelete: "CASCADE",
  })
  message: Message;
}
