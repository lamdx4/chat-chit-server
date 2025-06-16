// src/application/story/dto/story-list.dto.ts
import { Expose, Type } from "class-transformer";
import { Story } from "../../../core/entities/story.entity";
import { S } from "@faker-js/faker/dist/airline-BUL6NtOJ";

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

  @Expose()
  isViewed: boolean;

  @Expose()
  isReacted: boolean;

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

export class StoryWithUserDto {
  @Expose()
  storyId: number;

  @Expose()
  content: string;

  @Expose()
  type: string;

  @Expose()
  text: string;

  @Expose()
  visibility: number;

  @Expose()
  createdAt: Date;

  @Expose()
  isViewed: boolean;
  
  @Expose()
  isReacted: boolean;



  @Expose()
  user: {
    userId: number;
    userName: string;
    avatar: string | null;
    isFriend: boolean;
  };

  constructor(partial: Partial<StoryWithUserDto>) {
    Object.assign(this, partial);
  }
}


export class StoryReactionDto {
  @Expose()
  userId: number;

  @Expose()
  userName: string;

  @Expose()
  avatar: string;

  @Expose()
  isReacted: boolean; // 0 or 1

  constructor(partial: Partial<StoryReactionDto>) {
    Object.assign(this, partial);
  }
}


