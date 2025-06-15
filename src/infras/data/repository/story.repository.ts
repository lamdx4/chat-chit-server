import { Story } from "../../../core/entities/story.entity";
import { BaseRepository } from "./base.repository";
import { StoryFriendDto } from "../../../application/story/dtos/story-list.dto";


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


  async getFriendStories(currentUserId: number): Promise<StoryFriendDto[]> {
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
      .getRawMany();

    return results.map(row => 
      new StoryFriendDto({
      userId: row.user_userId,
      userName: row.user_userName,
      avatar: row.user_avatar,
      lastStoryTime: row.lastStoryTime || new Date(0),
      isViewed: parseInt(row.totalStories) > 0 && parseInt(row.totalStories) === parseInt(row.viewedStories)
      })
    );
  }
  
}
