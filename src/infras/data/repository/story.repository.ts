import { Story } from "../../../core/entities/story.entity";
import { BaseRepository } from "./base.repository";


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
}
