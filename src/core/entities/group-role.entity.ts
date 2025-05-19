import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToMany,
  JoinTable,
  ManyToOne,
  Index,
  JoinColumn,
} from "typeorm";
import { Permission } from "./permission.entity";
import { GroupChat } from "./group-chat.entity";

export enum MemberRole {
  Owner = "Creator",
  Member = "Member",
  Admin = "Admin",
}

@Entity("GroupRole")
@Unique("UQ_GroupRole_name_groupId", ["name", "groupId"])
export class GroupRole {
  @PrimaryGeneratedColumn()
  roleId: number;

  @Column({ length: 20 })
  name: string;

  @Column()
  groupId: number;

  @ManyToOne(() => GroupChat, (group) => group.roles, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "groupId" })
  group: GroupChat;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: "RolePermission",
    joinColumn: { name: "roleId", referencedColumnName: "roleId" },
    inverseJoinColumn: {
      name: "permissionId",
      referencedColumnName: "permissionId",
    },
  })
  permissions: Permission[];
}
