import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Poll } from "./poll.entity";
import { Member } from "./member.entity";

@Entity("PollOption")
export class PollOption {
  @PrimaryGeneratedColumn()
  optionId: number;

  @Column()
  pollId: number;

  @Column({ length: 255 })
  text: string;

  @ManyToOne(() => Poll, (poll) => poll.options, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pollId" })
  poll: Poll;

  @ManyToMany(() => Member, {
    eager: true,
  })
  @JoinTable({
    name: "PollVote",
    joinColumn: {
      name: "optionId",
      referencedColumnName: "optionId",
    },
    inverseJoinColumn: {
      name: "memberId",
      referencedColumnName: "memberId",
    },
  })
  votedBy: Member[];
}
