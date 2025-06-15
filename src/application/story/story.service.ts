import StoryRepository from "../../infras/data/repository/story.repository";
import { Result } from "../../web/utils/result";
import CreateStoryRequest from "../../web/controllers/story/reqs/create-story.request";
import { CloudService } from "../../infras/aws-s3/aws-s3.service";
import fs from "fs";
import Stream from "stream";
import { StoryFriendDto, UserStoryDto } from "./dtos/story-list.dto";
import { FriendStoryRaw, FriendsStoryListRaw } from "../../infras/data/repository/story.repository";

export default class StoryService {
  private storyRepository: StoryRepository;

  constructor() {
    this.storyRepository = new StoryRepository();
  }

  /**
   * Create a new story with optional file upload to S3.
   * @param userId   - The ID of the user creating the story
   * @param data     - Story data (text, type, visibility, etc.)
   * @param file     - Optional uploaded file (from multer)
   * @returns        - Result.ok(story) if successful, Result.fail if error
   */
  async createStory(
    userId: number,
    data: CreateStoryRequest,
    file?: Express.Multer.File
  ) {
    try {
      let contentUrl = data.content; // Default content URL from DTO

      if (file) {
        // Prepare S3 key (folder + timestamp + filename)
        const s3Key = `public/story/${Date.now()}-${file.originalname}`;

        // Create file stream from local temp file
        const fileStream = Stream.Readable.from(fs.createReadStream(file.path));


        await CloudService.getInstance().uploadStreamFile(
          s3Key,
          fileStream,
          file.mimetype
        );

        //Remove local temp file after upload
        fs.unlink(file.path, () => {});

        contentUrl = CloudService.getInstance().getStaticUrl(s3Key);
      }

      // 6. Save story to database, using the content URL
      const story = await this.storyRepository.createStory({
        ownerId: userId,
        content: contentUrl,
        type: data.type,
        text: data.text,
        visibility: data.visibility ?? 0, // Default to public
      });

      return Result.ok(story);

    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to create story due to server error");
    }
  }

  /**
   * Get stories from friends within the last 24 hours.
   * @param currentUserId - The ID of the current user
   * @returns             - List of stories from friends
   */
    async getFriendStories(currentUserId: number): Promise<Result<StoryFriendDto[]>> {
      try {
        const results = await this.storyRepository.getFriendStories(currentUserId) as FriendStoryRaw[];
        const stories = results.map((row: FriendStoryRaw) => 
          new StoryFriendDto({
            userId: row.user_userId,
            userName: row.user_userName,
            avatar: row.user_avatar,
            lastStoryTime: row.lastStoryTime ? new Date(row.lastStoryTime) : new Date(0),
            isViewed: parseInt(row.totalStories) > 0 && parseInt(row.totalStories) === parseInt(row.viewedStories)
          })
        );
        return Result.ok(stories);
      } catch (error) {
        console.error("StoryService Error:", error);
        return Result.fail(500, "Failed to get friend stories due to server error");
      }
    }

  /**
   * Get a list of friends who have posted stories within the last 24 hours.
   * @param currentUserId - The ID of the current user
   * @returns             - List of friends with their latest story info
   */
  async getFriendsStoryList(currentUserId: number): Promise<Result<UserStoryDto[]>> {
    try {
      const results = await this.storyRepository.getFriendsStoryList(currentUserId) as FriendsStoryListRaw[];
      
      // Group results by user
      const friendMap = new Map<number, {
        userId: number;
        userName: string;
        avatar: string;
        stories: {
          storyId: number;
          type: "image" | "video";
          content: string;
          text: string;
          createdAt: Date;
        }[];
        totalStories: number;
        viewedStories: number;
      }>();
      
      for (const row of results) {
        const userId = row.user_userId;
        
        if (!friendMap.has(userId)) {
          friendMap.set(userId, {
            userId: userId,
            userName: row.user_userName,
            avatar: row.user_avatar,
            stories: [],
            totalStories: 0,
            viewedStories: 0
          });
        }
        
        const friend = friendMap.get(userId)!;
        friend.stories.push({
          storyId: row.story_storyId,
          type: row.story_type,
          content: row.story_content,
          text: row.story_text,
          createdAt: row.story_createdAt,
        });
        
        friend.totalStories++;
        if (row.isViewedByCurrentUser === 1) {
          friend.viewedStories++;
        }
      }

      // Convert to array and calculate isViewed status
      const friendsWithStories: UserStoryDto[] = Array.from(friendMap.values())
        .map(friend => ({
          userId: friend.userId,
          userName: friend.userName,
          avatar: friend.avatar,
          isViewed: friend.totalStories > 0 && friend.viewedStories === friend.totalStories,
          stories: friend.stories
        }))
        .sort((a, b) => {
          const aLatest = a.stories.length > 0 ? new Date(a.stories[0].createdAt).getTime() : 0;
          const bLatest = b.stories.length > 0 ? new Date(b.stories[0].createdAt).getTime() : 0;
          return bLatest - aLatest;
        });

      return Result.ok(friendsWithStories);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to get friends story list due to server error");
    }
  }

  /**
   * Mark a story as viewed by a user.
   * @param storyId - The ID of the story being viewed
   * @param userId  - The ID of the user viewing the story
   * @returns       - Result.ok(true) if successful, Result.fail if error
   */
  async insertStoryView(storyId: number, userId: number): Promise<Result<boolean>> {
    try {
      // Check if the user has already viewed this story
      const existingView = await this.storyRepository.findStoryView(storyId, userId);
      
      if (existingView) {
        return Result.ok(true); // Already viewed, no need to insert
      }

      // Insert new story view with current timestamp
      await this.storyRepository.insertStoryView(storyId, userId, new Date());
      return Result.ok(true);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to record story view due to server error");
    }
  }

}
