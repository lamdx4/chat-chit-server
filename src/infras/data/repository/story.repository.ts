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

export interface UserStoryListRaw {
  user_userId: number;
  user_userName: string;
  user_avatar: string;
  story_storyId: number;
  story_type: "image" | "video";
  story_content: string;
  story_text: string;
  story_createdAt: Date;
  story_isViewed: number; // 0 or 1 from CASE WHEN - moved to story level
  story_isReacted: number; // 0 or 1 from CASE WHEN
}

export interface UserStoryArchivedRaw {
  user_userId: number;
  user_userName: string;
  user_avatar: string;
  story_storyId: number;
  story_type: "image" | "video";
  story_content: string;
  story_text: string;
  story_createdAt: Date;
  story_isViewed: number; // 0 or 1 from CASE WHEN
  story_isReacted: number; // 0 or 1 from CASE WHEN
  story_viewCount: number; // Total view count as string from COUNT
  story_reactCount: number; // Total react count as string from COUNT
}

export interface StoryWithUserRaw {
  story_storyId: number;
  story_type: "image" | "video";
  story_content: string;
  story_text: string;
  story_createdAt: Date;
  story_visibility: number;
  story_isViewed: number;
  story_isReacted: number;
  user_isFriend: number;
  user_userId: number;
  user_userName: string;
  user_avatar: string;
}

export interface StoryInteractionRaw {
  user_userId: number;
  user_userName: string;
  user_avatar: string;
  react_isReacted: number; // 0 or 1
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


  async getFriendsStoryList(currentUserId: number): Promise<UserStoryListRaw[]> {
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
      "CASE WHEN view.viewerId IS NOT NULL THEN 1 ELSE 0 END as story_isViewed",
      "CASE WHEN react.reacterId IS NOT NULL THEN 1 ELSE 0 END as story_isReacted"
      ])
      .innerJoin("Story", "story", "story.ownerId = user.userId")
      .innerJoin("Relationship", "rel", 
      "(rel.requesterId = :currentUserId AND rel.addresseeId = user.userId AND rel.relationType = 'Friend') OR " +
      "(rel.addresseeId = :currentUserId AND rel.requesterId = user.userId AND rel.relationType = 'Friend')",
      { currentUserId }
      )
      .leftJoin("StoryView", "view", "view.storyId = story.storyId AND view.viewerId = :currentUserId", { currentUserId })
      .leftJoin("ReactStory", "react", "react.storyId = story.storyId AND react.reacterId = :currentUserId", { currentUserId })
      .where("story.createdAt >= :since", { since })
      .andWhere("story.ownerId != :currentUserId", { currentUserId })
      .orderBy("user.userId", "ASC")
      .addOrderBy("story.createdAt", "DESC")
      .getRawMany() as UserStoryListRaw[];

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

  /**
   * Get stories by specific user ID
   */
  async getStoriesByUserId(userId: number, currentUserId: number): Promise<UserStoryListRaw[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let queryBuilder = this.manager
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
        "CASE WHEN view.viewerId IS NOT NULL THEN 1 ELSE 0 END as story_isViewed",
        "CASE WHEN react.reacterId IS NOT NULL THEN 1 ELSE 0 END as story_isReacted"
      ])
      .innerJoin("Story", "story", "story.ownerId = user.userId")
      .leftJoin("StoryView", "view", "view.storyId = story.storyId AND view.viewerId = :currentUserId", { currentUserId })
      .leftJoin("ReactStory", "react", "react.storyId = story.storyId AND react.reacterId = :currentUserId", { currentUserId })
      .where("user.userId = :userId", { userId })
      .andWhere("story.createdAt >= :since", { since });

    // If viewing someone else's stories, check relationship and visibility
    if (userId !== currentUserId) {
      queryBuilder = queryBuilder
      .leftJoin("Relationship", "rel", 
        "(rel.requesterId = :currentUserId AND rel.addresseeId = user.userId AND rel.relationType = 'Friend') OR " +
        "(rel.addresseeId = :currentUserId AND rel.requesterId = user.userId AND rel.relationType = 'Friend')",
        { currentUserId }
      )
      .andWhere("(rel.relationType IS NOT NULL OR story.visibility = 0)");
    }

    const results = await queryBuilder
      .orderBy("story.createdAt", "DESC")
      .getRawMany() as UserStoryListRaw[];

    return results;
  }


  /**
   * Get archived stories by specific user ID
   */
  async getArchivedStoriesByUserId(userId: number, currentUserId: number): Promise<UserStoryArchivedRaw[]> {
    let queryBuilder = this.manager
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
        "CASE WHEN view.viewerId IS NOT NULL THEN 1 ELSE 0 END as story_isViewed",
        "CASE WHEN react.reacterId IS NOT NULL THEN 1 ELSE 0 END as story_isReacted",
        "COUNT(DISTINCT allViews.viewerId) as story_viewCount",
        "COUNT(DISTINCT allReacts.reacterId) as story_reactCount"
      ])
      .innerJoin("Story", "story", "story.ownerId = user.userId")
      .leftJoin("StoryView", "view", "view.storyId = story.storyId AND view.viewerId = :currentUserId", { currentUserId })
      .leftJoin("ReactStory", "react", "react.storyId = story.storyId AND react.reacterId = :currentUserId", { currentUserId })
      .leftJoin("StoryView", "allViews", "allViews.storyId = story.storyId")
      .leftJoin("ReactStory", "allReacts", "allReacts.storyId = story.storyId")
      .where("user.userId = :userId", { userId })
      .andWhere("story.isArchived = 1")
      .groupBy("user.userId, user.userName, user.avatar, story.storyId, story.type, story.content, story.text, story.createdAt, view.viewerId, react.reacterId");

    // If viewing someone else's archived stories, check relationship and visibility
    if (userId !== currentUserId) {
      queryBuilder = queryBuilder
      .leftJoin("Relationship", "rel", 
        "(rel.requesterId = :currentUserId AND rel.addresseeId = user.userId AND rel.relationType = 'Friend') OR " +
        "(rel.addresseeId = :currentUserId AND rel.requesterId = user.userId AND rel.relationType = 'Friend')",
        { currentUserId }
      )
      .andWhere("(rel.relationType IS NOT NULL OR story.visibility = 0)");
    }

    const results = await queryBuilder
      .orderBy("story.createdAt", "DESC")
      .getRawMany() as UserStoryArchivedRaw[];

    return results;
  }

  /**
   * Get recent stories including friends' stories and public stories
   */
  async getRecentStories(currentUserId: number): Promise<StoryWithUserRaw[]> {
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
      "story.visibility",
      "CASE WHEN view.viewerId IS NOT NULL THEN 1 ELSE 0 END as story_isViewed",
      "CASE WHEN react.reacterId IS NOT NULL THEN 1 ELSE 0 END as story_isReacted",
      "CASE WHEN rel.relationType = 'Friend' THEN 1 ELSE 0 END as user_isFriend"
      ])
      .innerJoin("Story", "story", "story.ownerId = user.userId")
      .leftJoin("Relationship", "rel", 
      "(rel.requesterId = :currentUserId AND rel.addresseeId = user.userId AND rel.relationType = 'Friend') OR " +
      "(rel.addresseeId = :currentUserId AND rel.requesterId = user.userId AND rel.relationType = 'Friend')",
      { currentUserId }
      )
      .leftJoin("StoryView", "view", "view.storyId = story.storyId AND view.viewerId = :currentUserId", { currentUserId })
      .leftJoin("ReactStory", "react", "react.storyId = story.storyId AND react.reacterId = :currentUserId", { currentUserId })
      .where("story.createdAt >= :since", { since })
      .andWhere("story.ownerId != :currentUserId", { currentUserId })
      .andWhere("(rel.relationType = 'Friend' OR story.visibility = 0)")
      .orderBy("story.createdAt", "DESC")
      .limit(9)
      .getRawMany() as StoryWithUserRaw[];

    return results;
    }
  

    /**
     * Check if a story reaction already exists
     */
    async findStoryReact(storyId: number, reacterId: number) {
      return this.manager.getRepository("ReactStory").findOne({ where: { storyId, reacterId } });
    }

    /**
     * Insert a new story reaction
     */
    async insertStoryReact(storyId: number, reacterId: number) {
      return this.manager.getRepository("ReactStory").save({ storyId, reacterId });
    }


    /**
     * Get story interactions (views and reactions) for a story owned by the user
     */
    async getStoryInteractions(storyId: number, userId: number): Promise<StoryInteractionRaw[]> {
      const results = await this.manager
        .createQueryBuilder("Story", "story")
        .select([
          "user.userId",
          "user.userName",
          "user.avatar",
          "CASE WHEN react.reacterId IS NOT NULL THEN 1 ELSE 0 END as react_isReacted"
        ])
        .innerJoin("StoryView", "view", "view.storyId = story.storyId")
        .innerJoin("User", "user", "user.userId = view.viewerId")
        .leftJoin("ReactStory", "react", "react.storyId = story.storyId AND react.reacterId = user.userId")
        .where("story.storyId = :storyId", { storyId })
        .andWhere("story.ownerId = :userId", { userId })
        .orderBy("view.viewAt", "DESC")
        .getRawMany() as StoryInteractionRaw[];

      return results;
    }

    /**
     * Archive a story by setting isArchived to 1
     */
    async archiveStory(storyId: number, userId: number): Promise<boolean> {
      const result = await this.update(
        { storyId, ownerId: userId },
        { isArchived: true }
      );
      
      return result.affected! > 0;
    }

    /**
     * Check if a story is archived
     */
    async isStoryArchived(storyId: number): Promise<boolean> {
      const story = await this.findOne({ 
        where: { storyId, isArchived: true },
        select: ['storyId'] 
      });
      
      return !!story;
    }

}
