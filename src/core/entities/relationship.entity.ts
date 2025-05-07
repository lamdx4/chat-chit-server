// relationship.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum RelationType {
  Pending = "Pending",
  Friend = "Friend",
  Block = "Block",
  ReplyAccepted = "ReplyAccepted",
}

@Entity({ name: "Relationship" })
export class Relationship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  requesterId?: number;

  @Column({ nullable: true })
  addresseeId?: number;

  @Column({ type: "enum", enum: RelationType })
  relationType: RelationType;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createAt: Date;

  @ManyToOne(() => User, (user) => user.relationshipRequesters)
  @Index("requesterId")
  @JoinColumn({ name: "requesterId" })
  requester?: User;

  @ManyToOne(() => User, (user) => user.relationshipAddressees)
  @JoinColumn({ name: "addresseeId" })
  addressee?: User;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;
}
