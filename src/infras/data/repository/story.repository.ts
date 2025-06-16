import { Story } from "../../../core/entities/story.entity";
import { BaseRepository } from "./base.repository";


export interface FriendStoryRaw {
  user_userId: number;
  user_userName: string;
  user_avatar: string;
  lastStoryTime: string; // Date as string from raw query
  totalStories: string;
  viewedStories: string;
}

export interface FriendsStoryListRaw {
  user_userId: number;
  user_userName: string;
  user_avatar: string;
  story_storyId: number;
  story_type: "image" | "video";
  story_content: string;
  story_text: string;
  story_createdAt: Date;
  story_isViewed: number; // 0 or 1 from CASE WHEN - moved to story level
}

export default class StoryRepository extends BaseRepository<Story> {
  constructor() {
    super(Story);
  }

  /**
   * Create and save a new story
   */
  async createStory(data: {
    ownerId: number;
    content: string;
    type: "image" | "video";
    text?: string;
    visibility?: number;
  }) {
    const story = this.create({
      ownerId: data.ownerId,
      content: data.content,
      type: data.type,
      text: data.text,
      visibility: typeof data.visibility !== "undefined" ? data.visibility : 0,
    });
    const savedStory = await this.save(story);
    return savedStory;
  }


  async getFriendStories(currentUserId: number): Promise<FriendStoryRaw[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  

    const results = await this.manager
      .createQueryBuilder("User", "user")
      .select([
      "user.userId",
      "user.userName", 
      "user.avatar",
      "MAX(story.createdAt) as lastStoryTime",
      "COUNT(story.storyId) as totalStories",
      "COUNT(view.viewerId) as viewedStories"
      ])
      .innerJoin("Story", "story", "story.ownerId = user.userId")
      .innerJoin("Relationship", "rel", 
      "(rel.requesterId = :currentUserId AND rel.addresseeId = user.userId AND rel.relationType = 'Friend') OR " +
      "(rel.addresseeId = :currentUserId AND rel.requesterId = user.userId AND rel.relationType = 'Friend')",
      { currentUserId }
      )
      .leftJoin("StoryView", "view", "view.storyId = story.storyId AND view.viewerId = :currentUserId", { currentUserId })
      .where("story.createdAt >= :since", { since })
      .andWhere("story.ownerId != :currentUserId", { currentUserId })
      .groupBy("user.userId, user.userName, user.avatar")
      .orderBy("lastStoryTime", "DESC")
      .getRawMany() as FriendStoryRaw[];

      return results;


  }


  async getFriendsStoryList(currentUserId: number): Promise<FriendsStoryListRaw[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const results = await this.manager
      .createQueryBuilder("User", "user")
      .select([
      "user.userId",
      "user.userName", 
      "user.avatar",
      "story.storyId",
      "story.type",
      "story.content",
      "story.text",
      "story.createdAt",
      "CASE WHEN view.viewerId IS NOT NULL THEN 1 ELSE 0 END as story_isViewed"
      ])
      .innerJoin("Story", "story", "story.ownerId = user.userId")
      .innerJoin("Relationship", "rel", 
      "(rel.requesterId = :currentUserId AND rel.addresseeId = user.userId AND rel.relationType = 'Friend') OR " +
      "(rel.addresseeId = :currentUserId AND rel.requesterId = user.userId AND rel.relationType = 'Friend')",
      { currentUserId }
      )
      .leftJoin("StoryView", "view", "view.storyId = story.storyId AND view.viewerId = :currentUserId", { currentUserId })
      .where("story.createdAt >= :since", { since })
      .andWhere("story.ownerId != :currentUserId", { currentUserId })
      .orderBy("user.userId", "ASC")
      .addOrderBy("story.createdAt", "DESC")
      .getRawMany() as FriendsStoryListRaw[];

      return results;

  }

  /**
   * Check if a story view already exists
   */
  async findStoryView(storyId: number, viewerId: number) {
    return this.manager.getRepository("StoryView").findOne({ where: { storyId, viewerId } });
  }

  /**
   * Insert a new story view
   */
  async insertStoryView(storyId: number, viewerId: number, viewAt: Date) {
    return this.manager.getRepository("StoryView").save({ storyId, viewerId, viewAt });
  }
  
}
