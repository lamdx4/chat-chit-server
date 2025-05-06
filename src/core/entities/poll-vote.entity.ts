import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
  } from "typeorm";
  import { PollOption } from "./poll-option.entity";
  import { Member } from "./member.entity";
  
  @Entity("PollVote")
  @Unique(["optionId", "memberId"])
  export class PollVote {
    @PrimaryGeneratedColumn()
    voteId: number;
  
    @Column()
    optionId: number;
  
    @Column()
    memberId: number;
  
    @CreateDateColumn({ type: "datetime" })
    votedAt: Date;
  
    @ManyToOne(() => PollOption, (option) => option.votes, { onDelete: "CASCADE" })
    @JoinColumn({ name: "optionId" })
    option: PollOption;
  
    @ManyToOne(() => Member, { onDelete: "CASCADE" })
    @JoinColumn({ name: "memberId" })
    member: Member;
  }
  