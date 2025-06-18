export default class CreateStoryRequest {
  content: string; // Link  to the file (image or video) - REQUIRED
  type: "image" | "video"; // REQUIRED
  text?: string; 
  visibility: number; 

  constructor(
    content: string,
    type: "image" | "video",
    text?: string,
    visibility?: number
  ) {
    this.content = content;
    this.type = type;
    this.text = text;
    this.visibility = visibility ?? 0; // Default: public
  }
}
