import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
  } from "typeorm";
  import { Poll } from "./poll.entity";
  import { PollVote } from "./poll-vote.entity";
  
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
  
    @OneToMany(() => PollVote, (vote) => vote.option)
    votes: PollVote[];
  }
  