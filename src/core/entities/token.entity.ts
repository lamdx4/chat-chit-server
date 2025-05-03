// token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "Token" })
@Index("userId", ["userId"])
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  refreshToken: string;

  @Column({ type: "datetime" })
  expiresAt: Date;

  @Column()
  userId: number;

  @Column({ length: 20 })
  notificationToken: string;

  @Column()
  deviceInformation: string;

  @ManyToOne(() => User, (user) => user.tokens, { onDelete: "CASCADE" })
  user: User;
}
