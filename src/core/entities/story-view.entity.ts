import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  Index,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Story } from "./story.entity";

@Entity({ name: "StoryView" })
export class StoryView {
  @PrimaryColumn()
  viewerId: number;

  @PrimaryColumn()
  storyId: number;

  @Column({ type: "datetime", nullable: false, default: () => "CURRENT_TIMESTAMP" })
  viewAt: Date;

  @ManyToOne(() => User)
  @Index("viewerId")
  @JoinColumn({ name: "viewerId" })
  viewer?: User;

  @ManyToOne(() => Story, (story) => story.storyViews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "storyId" })
  story?: Story;
}