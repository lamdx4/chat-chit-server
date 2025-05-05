import { Router } from "express";

import UserController from "./user.controller";
import asyncUtil from "../../utils/async-wrapper";
import authenticateMiddleware from "../../middlewares/authenticate.middleware";
import changeBaseProfileValidator from "./validators/change-base-profile.validator";

const userController = new UserController();

let userRouter = Router();

userRouter.get(
  "/search",
  asyncUtil(userController.searchUsers.bind(userController))
);

userRouter.get(
  "/my-profile",
  authenticateMiddleware,
  asyncUtil(userController.getMyProfile.bind(userController))
);

userRouter.get(
  "/profile/change-avatar",
  authenticateMiddleware,

  asyncUtil(userController.changeMyProfile.bind(userController))
);

userRouter.put(
  "/my-profile",
  authenticateMiddleware,
  changeBaseProfileValidator,
  asyncUtil(userController.changeMyProfile.bind(userController))
);

export default userRouter;
