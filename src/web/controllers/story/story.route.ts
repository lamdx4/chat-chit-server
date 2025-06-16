import { Router, Request } from "express";
import StoryController from "./story.controller";
import authenticateMiddleware from "../../middlewares/authenticate.middleware";
import asyncUtil from "../../utils/async-wrapper";
import multer from "multer";
import multerUploadConfig from "../../configurations/multer-config";
import handleValidationErrors from "../../utils/handle-validation-errors";
import createStoryValidator from "./validators/create-story.validator";

const storyRouter = Router();
const storyController = new StoryController();

// File filter for images and videos
const allowedTypes = [
  "image/jpeg", "image/png", "image/jpg",
  "video/mp4", "video/quicktime", "video/webm"
];
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("INVALID_FILE_TYPE"));
  }
  cb(null, true);
};

storyRouter.post(
  "/",
  authenticateMiddleware,
  multer({ ...multerUploadConfig, fileFilter }).single("file"), // handle file upload from form-data "file"
  createStoryValidator,            // express-validator rules for text/visibility
  handleValidationErrors,          // send back error if request not valid
  asyncUtil(storyController.createStory.bind(storyController))
);


storyRouter.get(
  "/friends",
  authenticateMiddleware,
  asyncUtil(storyController.getFriendStories.bind(storyController))
);

storyRouter.get(
  "/friends/list",
  authenticateMiddleware,
  asyncUtil(storyController.getFriendsStoryList.bind(storyController))
);

storyRouter.post(
  "/:storyId/view",
  authenticateMiddleware,
  asyncUtil(storyController.viewStory.bind(storyController))
);

storyRouter.get(
  "/user/:targetUserId",
  authenticateMiddleware,
  asyncUtil(storyController.getStoriesByUserId.bind(storyController))
);

export default storyRouter;
