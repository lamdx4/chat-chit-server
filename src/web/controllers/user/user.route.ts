import { Router } from "express";
import UserController from "./user.controller";
import asyncUtil from "../../utils/async-wrapper";
import authenticateMiddleware from "../../middlewares/authenticate.middleware";
import changeBaseProfileValidator from "./validators/change-base-profile.validator";
import multer from "multer";
import multerUploadConfig from "../../configurations/multer-config";
import { handleMulterErrorMiddleware } from "../../middlewares/multer-handler-error";
import path from "path";
import cursorPagValidator from "./validators/get-friend-validator";
import handleValidationErrors from "../../utils/handle-validation-errors";
import { U } from "@faker-js/faker/dist/airline-BUL6NtOJ";
import acceptFriendRequestValidator from "./validators/accept-req-friend";

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
userRouter.post(
  "/profile/change-avatar",
  authenticateMiddleware,
  multer({
    ...multerUploadConfig,
    fileFilter: (_req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("INVALID_FILE_TYPE"));
      }
      cb(null, true);
    },
  }).single("avatar"),
  handleMulterErrorMiddleware,
  asyncUtil(userController.changeAvatar.bind(userController))
);

userRouter.put(
  "/my-profile",
  authenticateMiddleware,
  changeBaseProfileValidator,
  handleValidationErrors,
  asyncUtil(userController.changeMyProfile.bind(userController))
);

userRouter.post(
  "/profile/change-username",
  authenticateMiddleware,
  asyncUtil(userController.changeUserName.bind(userController))
);

userRouter.get(
  "/link/google",
  authenticateMiddleware,
  asyncUtil(userController.getLinkUrlLogin.bind(userController))
);

userRouter.post(
  "/link/google",
  authenticateMiddleware,
  asyncUtil(userController.linkGoogleToAccount.bind(userController))
);

userRouter.post(
  "/unlink/google-account",
  authenticateMiddleware,
  asyncUtil(userController.unlinkGoogleAccount.bind(userController))
);

userRouter.get(
  "/relationship/friend",
  authenticateMiddleware,
  cursorPagValidator,
  handleValidationErrors,
  asyncUtil(userController.getFriendList.bind(userController))
);

userRouter.get(
  "/relationship/friend-request-list",
  authenticateMiddleware,
  cursorPagValidator,
  handleValidationErrors,
  asyncUtil(userController.getFriendRequestList.bind(userController))
);

userRouter.get(
  "/relationship/friend/friend-request-sent-list",
  authenticateMiddleware,
  cursorPagValidator,
  handleValidationErrors,
  asyncUtil(userController.getFriendRequestSentList.bind(userController))
);

userRouter.get(
  "/relationship/block",
  authenticateMiddleware,
  cursorPagValidator,
  handleValidationErrors,
  asyncUtil(userController.getBlockList.bind(userController))
);

// userRouter.post(
//   "/friend/send-request",
//   authenticateMiddleware,
//   asyncUtil(userController.sendFriendRequest.bind(userController))
// );

userRouter.post(
  "/relationship/accept-request-friend",
  authenticateMiddleware,
  acceptFriendRequestValidator,
  handleValidationErrors,
  asyncUtil(userController.acceptFriendRequest.bind(userController))
);

userRouter.post(
  "/relationship/reject-request-friend",
  authenticateMiddleware,
  acceptFriendRequestValidator,
  handleValidationErrors,
  asyncUtil(userController.rejectFriendRequest.bind(userController))
);

userRouter.post(
  "/relationship/cancel-request-sent",
  authenticateMiddleware,
  acceptFriendRequestValidator,
  handleValidationErrors,
  asyncUtil(userController.cancelMyFriendRequestSent.bind(userController))
);

userRouter.post(
  "/relationship/friend/remove-friend",
  authenticateMiddleware,
  acceptFriendRequestValidator,
  handleValidationErrors,
  asyncUtil(userController.removeFriend.bind(userController))
);

userRouter.post(
  "/relationship/block-user",
  authenticateMiddleware,
  acceptFriendRequestValidator,
  handleValidationErrors,
  asyncUtil(userController.blockUser.bind(userController))
);

userRouter.post(
  "/relationship/unblock-user",
  authenticateMiddleware,
  acceptFriendRequestValidator,
  handleValidationErrors,
  asyncUtil(userController.unblockUser.bind(userController))
);

export default userRouter;
