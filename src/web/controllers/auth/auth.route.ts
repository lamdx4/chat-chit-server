import { Router } from "express";

import AuthController from "./auth.controller";
import loginValidator from "./validators/login.validator";
import handleValidationErrors from "../../utils/handle-validation-errors";
import registerValidator from "./validators/registetr.validator";
import asyncUtil from "../../utils/async-wrapper";
import { changePasswordValidator } from "./validators/change-password.validator";

let authRouter = Router();


const authController = new AuthController();

authRouter.post(
  "/login",
  loginValidator,
  handleValidationErrors,
  asyncUtil(authController.login.bind(authController))
);

authRouter.post(
  "/register",
  registerValidator,
  handleValidationErrors,
  asyncUtil(authController.register.bind(authController))
);

authRouter.post(
  "/logout",
  asyncUtil(authController.logout.bind(authController))
);
authRouter.post(
  "/refresh-token",
  asyncUtil(authController.refreshToken.bind(authController))
);
authRouter.post(
  "/forgot-password",
  asyncUtil(authController.forgotPassword.bind(authController))
);

authRouter.put(
  "/change-password",
  changePasswordValidator,
  handleValidationErrors,
  asyncUtil(authController.changePassword.bind(authController))
);

export default authRouter;
