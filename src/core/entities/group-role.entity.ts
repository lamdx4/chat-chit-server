import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToMany,
  JoinTable,
  ManyToOne,
  Index,
} from "typeorm";
import { Permission } from "./permission.entity";
import { GroupChat } from "./group-chat.entity";

@Entity("GroupRole")
@Unique(["name", "groupId"])
export class GroupRole {
  @PrimaryGeneratedColumn()
  roleId: number;

  @Column({ length: 20 })
  name: string;

  @Column()
  groupId: number;

  @ManyToOne(() => GroupChat, { onDelete: "CASCADE" })
  @JoinTable({ name: "groupId" })
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
