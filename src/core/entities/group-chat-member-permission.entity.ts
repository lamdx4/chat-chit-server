// group-chat-member-permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { GroupChat } from "./group-chat.entity";

@Entity("GroupChatMemberPermission")
export class GroupChatMemberPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column("tinyint")
  changeName: number;

  @Column("tinyint")
  pinMessage: number;

  @Column("tinyint")
  createPoll: number;

  @Column("tinyint")
  sendMessage: number;

  @Column("tinyint")
  autoApproval: number;

  @Column("tinyint")
  changeAvatar: number;

  @ManyToOne(() => GroupChat, (group) => group.groupChatMemberPermissions)
  group: GroupChat;
}
