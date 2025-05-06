import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
  } from "typeorm";
  import { PollOption } from "./poll-option.entity";
  import { Message } from "./message.entity";
  
  @Entity("Poll")
  export class Poll {
    @PrimaryGeneratedColumn()
    pollId: number;
  
    @Index({ unique: true })
    @Column()
    messageId: number;
  
    @Column({ type: "tinyint", default: 0 })
    isMultipleChoice: boolean;
  
    @Column({ type: "datetime", nullable: true })
    expiredAt?: Date;
  
    @CreateDateColumn({ type: "datetime" })
    createdAt: Date;
  
    @OneToMany(() => PollOption, (option) => option.poll)
    options: PollOption[];
  
    @OneToOne(() => Message, (message) => message.poll)
    @JoinColumn({ name: "messageId" })
    message: Message;
  }
  