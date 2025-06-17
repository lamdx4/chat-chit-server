import StoryRepository, { StoryInteractionRaw, UserStoryArchivedRaw } from "../../infras/data/repository/story.repository";
import { Result } from "../../web/utils/result";
import CreateStoryRequest from "../../web/controllers/story/reqs/create-story.request";
import { CloudService } from "../../infras/aws-s3/aws-s3.service";
import fs from "fs";
import Stream from "stream";
import { StoryFriendDto, UserStoryDto, StoryWithUserDto, StoryReactionDto, StoryDto, UserStoryArchivedDto, StoryArchivedDto } from "./dtos/story-list.dto";
import { FriendStoryRaw, UserStoryListRaw, StoryWithUserRaw } from "../../infras/data/repository/story.repository";

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

      // Save story to database, using the content URL
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
            isViewed: parseInt(row.totalStories) > 0 && parseInt(row.totalStories) == parseInt(row.viewedStories)
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
      const results = await this.storyRepository.getFriendsStoryList(currentUserId) as UserStoryListRaw[];
      
      // Group results by user
      const friendMap = new Map<number, {
        userId: number;
        userName: string;
        avatar: string;
        stories: StoryDto[];
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
        friend.stories.push(new StoryDto({
          storyId: row.story_storyId,
          type: row.story_type,
          content: row.story_content,
          text: row.story_text,
          createdAt: row.story_createdAt,
          isViewed: row.story_isViewed == 1,
          isReacted: row.story_isReacted == 1
        }));
        
        friend.totalStories++;
        if (row.story_isViewed == 1) {
          friend.viewedStories++;
        }
      }

      // Convert to array and calculate isViewed status
      const friendsWithStories: UserStoryDto[] = Array.from(friendMap.values())
        .map(friend => ({
          userId: friend.userId,
          userName: friend.userName,
          avatar: friend.avatar,
          isViewed: friend.totalStories > 0 && friend.viewedStories == friend.totalStories,
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



  /**
   * Get stories by specific user ID
   * @param userId - The ID of the user whose stories to retrieve
   * @param currentUserId - The ID of the current user viewing the stories
   * @returns - Result with list of stories from the specified user
   */
  async getStoriesByUserId(userId: number, currentUserId: number): Promise<Result<UserStoryDto>> {
    try {
      const results = await this.storyRepository.getStoriesByUserId(userId, currentUserId) as UserStoryListRaw[];
      
      if (results.length == 0) {
        return Result.fail(404, "User not found or has no stories");
      }

      // Process the first row to get user info
      const firstRow = results[0];
      const stories: StoryDto[] = [];
      
      let totalStories = 0;
      let viewedStories = 0;
      
      for (const row of results) {
        stories.push(new StoryDto({
          storyId: row.story_storyId,
          type: row.story_type,
          content: row.story_content,
          text: row.story_text,
          createdAt: row.story_createdAt,
          isViewed: row.story_isViewed == 1,
          isReacted: row.story_isReacted == 1
        }));
        
        totalStories++;
        if (row.story_isViewed == 1) {
          viewedStories++;
        }
      }

      const userStory: UserStoryDto = {
        userId: firstRow.user_userId,
        userName: firstRow.user_userName,
        avatar: firstRow.user_avatar,
        isViewed: totalStories > 0 && viewedStories == totalStories,
        stories: stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      };

      return Result.ok(userStory);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to get user stories due to server error");
    }
  }

  /**
   * Get recent stories from friends and public stories within the last 24 hours.
   * @param currentUserId - The ID of the current user
   * @returns - Result with list of recent stories
   */
  async getRecentStories(currentUserId: number): Promise<Result<StoryWithUserDto[]>> {
    try {
      const results = await this.storyRepository.getRecentStories(currentUserId) as StoryWithUserRaw[];
      
      const stories = results.map((row: StoryWithUserRaw) => 
        new StoryWithUserDto({
          storyId: row.story_storyId,
          type: row.story_type,
          content: row.story_content,
          text: row.story_text,
          createdAt: row.story_createdAt,
          isViewed: row.story_isViewed == 1,
          visibility: row.story_visibility,
          isReacted: row.story_isReacted == 1,
          user: {
            userId: row.user_userId,
            userName: row.user_userName,
            avatar: row.user_avatar,
            isFriend: row.user_isFriend == 1
          }
        })
      );
      
      return Result.ok(stories);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to get recent stories due to server error");
    }
  }


  /**
   * React to a story by a user.
   * @param storyId - The ID of the story being reacted to
   * @param reacterId - The ID of the user reacting to the story
   * @returns - Result.ok(reaction) if successful, Result.fail if error
   */
  async insertStoryReact(storyId: number, reacterId: number): Promise<Result<boolean>> {
    try {
      // Check if the user has already reacted to this story
      const existingReaction = await this.storyRepository.findStoryReact(storyId, reacterId);
      
      if (existingReaction) {
        return Result.ok(true); // Already reacted, no need to insert
      }

      // Insert new story reaction
      await this.storyRepository.insertStoryReact(storyId, reacterId);
      return Result.ok(true);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to react to story due to server error");
    }
  }
  
  /**
   * Get story interactions (views and reactions) for a specific story.
   * @param storyId - The ID of the story to get interactions for
   * @param userId - The ID of the user requesting the interactions
   * @returns - Result with list of story interactions
   */
  async getStoryInteractions(storyId: number, userId: number): Promise<Result<StoryReactionDto[]>> {
    try {
      const results = await this.storyRepository.getStoryInteractions(storyId, userId) as StoryInteractionRaw[];
      
      const reactions: StoryReactionDto[] = results.map(row => 
        new StoryReactionDto({
          userId: row.user_userId,
          userName: row.user_userName,
          avatar: row.user_avatar,
          isReacted: row.react_isReacted == 1
        })
      );
      
      return Result.ok(reactions);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to get story interactions due to server error");
    }
  }

  /**
   * Archive a story by its ID.
   * @param storyId - The ID of the story to archive
   * @param userId - The ID of the user who owns the story
   * @returns - Result.ok(true) if successful, Result.fail if error
   */
  async archiveStory(storyId: number, userId: number): Promise<Result<boolean>> {
    try {
      // Check if the story is already archived
      const isAlreadyArchived = await this.storyRepository.isStoryArchived(storyId);
      
      if (isAlreadyArchived) {
        return Result.ok(true); // Already archived, no need to archive again
      }

      // Archive the story
      const isArchived = await this.storyRepository.archiveStory(storyId, userId);
      
      if (!isArchived) {
        return Result.fail(404, "Story not found or you don't have permission to archive it");
      }
      
      return Result.ok(true);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to archive story due to server error");
    }
  }


  /**
   * Get archived stories by specific user ID
   * @param userId - The ID of the user whose archived stories to retrieve
   * @param currentUserId - The ID of the current user viewing the stories
   * @returns - Result with list of archived stories from the specified user
   */
  async getArchivedStoriesByUserId(userId: number, currentUserId: number): Promise<Result<UserStoryArchivedDto>> {
    try {
      const results = await this.storyRepository.getArchivedStoriesByUserId(userId, currentUserId) as UserStoryArchivedRaw[];
      
      if (results.length == 0) {
        return Result.fail(404, "User not found or has no archived stories");
      }

      // Process the first row to get user info
      const firstRow = results[0];
      const stories: StoryArchivedDto[] = [];
      
      for (const row of results) {
        stories.push(new StoryArchivedDto({
          storyId: row.story_storyId,
          type: row.story_type,
          content: row.story_content,
          text: row.story_text,
          createdAt: row.story_createdAt,
          isViewed: row.story_isViewed == 1,
          isReacted: row.story_isReacted == 1,
          viewCount: row.story_viewCount || 0,
          reactCount: row.story_reactCount || 0
        }));
      }

      const userStoryArchived = new UserStoryArchivedDto({
        userId: firstRow.user_userId,
        userName: firstRow.user_userName,
        avatar: firstRow.user_avatar,
        stories: stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      });

      return Result.ok(userStoryArchived);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to get archived user stories due to server error");
    }
  }

  /**
   * Delete a story by its ID, including removing the file from cloud storage
   * @param storyId - The ID of the story to delete
   * @param userId - The ID of the user who owns the story
   * @returns - Result.ok(true) if successful, Result.fail if error
   */
  async deleteStory(storyId: number, userId: number): Promise<Result<boolean>> {
    try {
      // First find the story to get its content URL
      const story = await this.storyRepository.findStoryById(storyId);
      
      if (!story) {
        return Result.fail(404, "Story not found");
      }

      // Check if the user owns the story
      if (story.ownerId !== userId) {
        return Result.fail(403, "You don't have permission to delete this story");
      }

      // Delete the story from database
      const isDeleted = await this.storyRepository.deleteStory(storyId);
      
      if (!isDeleted) {
        return Result.fail(500, "Failed to delete story from database");
      }

      // If story has content URL (file), delete it from cloud storage
      if (story.content && (story.content.includes('public/story/') || story.content.includes('public%2Fstory%2F'))) {
        try {
          // Extract S3 key from the URL - decode URI component to handle %2F encoding
          const url = new URL(story.content);
          const s3Key = decodeURIComponent(url.pathname.substring(1)); // Remove leading '/' and decode
          await CloudService.getInstance().deleteFile(s3Key);
        } catch (cloudError) {
          console.error("Failed to delete file from cloud storage:", cloudError);
        }
      }

      return Result.ok(true);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to delete story due to server error");
    }
  }
  


}
