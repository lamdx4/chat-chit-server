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
    const userId = req.userId!; // Should be set by auth middleware
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
}
