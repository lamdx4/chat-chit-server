import { Router } from "express";
import UserController from "./user.controller";
import asyncUtil from "../../utils/async-wrapper";
import authenticateMiddleware from "../../middlewares/authenticate.middleware";
import changeBaseProfileValidator from "./validators/change-base-profile.validator";
import multer from "multer";
import multerUploadConfig from "../../configurations/multer-config";
import { handleMulterErrorMiddleware } from "../../middlewares/multer-handler-error";
import path from "path";

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

// userRouter.post(
//   "/un-link/google",
//   authenticateMiddleware,
//   asyncUtil(userController.unlinkGoogleAccount.bind(userController))
// );



export default userRouter;
