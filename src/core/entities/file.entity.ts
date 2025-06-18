import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryColumn,
  OneToOne,
} from "typeorm";
import { User } from "./user.entity";
import { GroupChat } from "./group-chat.entity";

@Entity("File")
export class File {
  @PrimaryColumn({ type: "varchar", length: 100 })
  fileId: string;

  url: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  mimeType?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @OneToOne(() => File, { nullable: true })
  userAvatar?: User;

  @OneToOne(() => File, { nullable: true })
  groupAvatar?: GroupChat;
}
