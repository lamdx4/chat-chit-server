// src/application/story/dto/story-list.dto.ts
import { Expose, Type } from "class-transformer";
import { Story } from "../../../core/entities/story.entity";

export class StoryFriendDto {
  @Expose()
  userId: number;

  @Expose()
  userName: string;

  @Expose()
  avatar: string;

  @Expose()
  lastStoryTime: Date;

  @Expose()
  isViewed: boolean;

  constructor(partial: Partial<StoryFriendDto>) {
    Object.assign(this, partial);
  }
}

export class StoryDto {
  @Expose()
  storyId: number;

  @Expose()
  type: string;

  @Expose()
  content: string;

  @Expose()
  text?: string;

  @Expose()
  createdAt: Date;

  constructor(partial: Partial<StoryDto>) {
    Object.assign(this, partial);
  }
}


export class UserStoryDto {
  @Expose()
  userId: number;

  @Expose()
  userName: string;

  @Expose()
  avatar: string;

  @Expose()
  isViewed: boolean;

  @Expose()
  @Type(() => StoryDto)
  stories: StoryDto[];

  constructor(partial: Partial<UserStoryDto>) {
    Object.assign(this, partial);
    if (partial.stories) {
      this.stories = partial.stories.map(s => new StoryDto(s));
    }
  }
}


