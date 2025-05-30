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

@Entity({ name: "ReactStory" })
export class ReactStory {
  @PrimaryColumn()
  storyId: number;

  @PrimaryColumn()
  reacterId: number;

  @ManyToOne(() => Story, (story) => story.reactions)
  @JoinColumn({ name: "storyId" })
  story?: Story;

  @ManyToOne(() => User)
  @Index("reacterId")
  @JoinColumn({ name: "reacterId" })
  reacter?: User;
}