// filepath: /home/dxlaam/Projects/chat-chit-system/chat-chit-server/src/core/entities/story.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { StoryView } from "./story-view.entity";
import { ReactStory } from "./story-react.entity";

export enum StoryVisibility {
  Public = 0,
  Friends = 1,
  Private = 2,
}

@Entity({ name: "Story" })
export class Story {
  @PrimaryGeneratedColumn()
  storyId: number;

  @Column({ nullable: false })
  ownerId: number;

  @Column({ type: "varchar", length: 512, nullable: false })
  content: string;

  @Column({ type: "enum", enum: ["image", "video"], default: "image" })
  type: "image" | "video";

  @Column({ type: "varchar", length: 255, nullable: true })
  text?: string;

  @Column({ type: "int", nullable: false, default: 0 })
  visibility: StoryVisibility;

  @ManyToOne(() => User)
  @Index("ownerId")
  @JoinColumn({ name: "ownerId" })
  owner?: User;

  @OneToMany(() => StoryView, (storyView) => storyView.story)
  storyViews?: StoryView[];

  @OneToMany(() => ReactStory, (reactStory) => reactStory.story)
  reactions?: ReactStory[];

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;
}
