import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { GroupChat } from "./group-chat.entity";
import { Message } from "./message.entity";

@Entity("File")
export class File {
  @PrimaryColumn({ type: "char", length: 36 })
  fileId: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  key: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  url?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  mimeType?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @OneToOne(() => File, { nullable: true })
  userAvatar?: User;

  @OneToOne(() => File, { nullable: true })
  groupAvatar?: GroupChat;

  @OneToOne(() => File, { nullable: true })
  message?: Message;
}
