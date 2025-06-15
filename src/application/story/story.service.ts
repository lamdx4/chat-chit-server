import StoryRepository from "../../infras/data/repository/story.repository";
import { Result } from "../../web/utils/result";
import CreateStoryRequest from "../../web/controllers/story/reqs/create-story.request";
import { CloudService } from "../../infras/aws-s3/aws-s3.service";
import fs from "fs";
import Stream from "stream";
import { StoryFriendDto } from "./dtos/story-list.dto";

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
      const stories = await this.storyRepository.getFriendStories(currentUserId);
      return Result.ok(stories);
    } catch (error) {
      console.error("StoryService Error:", error);
      return Result.fail(500, "Failed to get friend stories due to server error");
    }
  }








}
