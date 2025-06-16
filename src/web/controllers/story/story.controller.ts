import { Request, Response, NextFunction } from "express";
import StoryService from "../../../application/story/story.service";
import { ResponseData } from "../../utils/response-data";
import CreateStoryRequest from "./reqs/create-story.request";

export default class StoryController {
  private storyService: StoryService;

  constructor() {
    this.storyService = new StoryService();
  }

  /**
   * Handle create story request
   */
  async createStory(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!; 
    const { text, visibility } = req.body;
    const file = req.file;

    // Validate file presence
    if (!file) {
      return res.status(400).json(
        ResponseData.fail("FILE_REQUIRED", {
          file: ["File is required."]
        })
      );
    }

    // Validate file size (must be less than 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return res.status(400).json(
        ResponseData.fail("FILE_TOO_LARGE", {
          file: ["File size must be less than 50MB."]
        })
      );
    }

    // Validate file type (accept only image or video)
    if (!["image/", "video/"].some((type) => file.mimetype.startsWith(type))) {
      return res.status(400).json(
        ResponseData.fail("INVALID_FILE_TYPE", {
          file: ["Only image or video files are accepted."]
        })
      );
    }

    // Prepare DTO for service (no need to set local path for content)
    const storyRequest = new CreateStoryRequest(
      "", // Content will be set by service after upload to S3
      file.mimetype.startsWith("video") ? "video" : "image",
      text || "",
      visibility !== undefined ? Number(visibility) : 0
    );

    // Call service to create story, pass the uploaded file
    const result = await this.storyService.createStory(userId, storyRequest, file);

    // Return result based on service response
    if (result.isSuccess) {
      return res.status(201).json(ResponseData.success(result.data, result.message)); // Use 201 Created
    } else {
      return res.status(result.code ?? 500).json(ResponseData.fail(result.message, result.errors));
    }
  }

  /**
   * Get stories from friends
   */
  async getFriendStories(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;

    const result = await this.storyService.getFriendStories(userId);

    if (result.isSuccess) {
      return res.status(200).json(ResponseData.success(result.data, result.message));
    } else {
      return res.status(result.code ?? 500).json(ResponseData.fail(result.message, result.errors));
    }
  }

  /**
   * Get friends story list
   */
  async getFriendsStoryList(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;

    const result = await this.storyService.getFriendsStoryList(userId);

    if (result.isSuccess) {
      return res.status(200).json(ResponseData.success(result.data, result.message));
    } else {
      return res.status(result.code ?? 500).json(ResponseData.fail(result.message, result.errors));
    }
  }

  /**
   * Handle view story request
   */
  async viewStory(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const { storyId } = req.params;

    // Validate storyId
    if (!storyId || isNaN(Number(storyId))) {
      return res.status(400).json(
        ResponseData.fail("INVALID_STORY_ID", {
          storyId: ["Story ID is required and must be a valid number."]
        })
      );
    }

    const result = await this.storyService.insertStoryView(Number(storyId), userId);

    if (result.isSuccess) {
      return res.status(200).json(ResponseData.success(result.data, result.message));
    } else {
      return res.status(result.code ?? 500).json(ResponseData.fail(result.message, result.errors));
    }
  }


  /**
   * Get stories by user ID
   */
  async getStoriesByUserId(req: Request, res: Response, next: NextFunction) {
    const userId = req.userId!;
    const { targetUserId } = req.params;

    // Use current user ID if targetUserId is not provided or invalid
    let finalTargetUserId = userId;
    if (targetUserId && !isNaN(Number(targetUserId))) {
      finalTargetUserId = Number(targetUserId);
    }

    const result = await this.storyService.getStoriesByUserId(finalTargetUserId, userId);

    if (result.isSuccess) {
      return res.status(200).json(ResponseData.success(result.data, result.message));
    } else {
      return res.status(result.code ?? 500).json(ResponseData.fail(result.message, result.errors));
    }
  }





}
