import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToMany,
} from "typeorm";
import { GroupRole } from "./group-role.entity";

@Entity("Permission")
@Unique(["name"])
export class Permission {
  @PrimaryGeneratedColumn()
  permissionId: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100 })
  description: string;

  @ManyToMany(() => GroupRole, (role) => role.permissions)
  roles: GroupRole[];
}
