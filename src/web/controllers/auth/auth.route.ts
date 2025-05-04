import { Router } from "express";

import AuthController from "./auth.controller";
import loginValidator from "./validators/login.validator";
import handleValidationErrors from "../../utils/handle-validation-errors";
import registerValidator from "./validators/registetr.validator";
import asyncUtil from "../../utils/async-wrapper";

let authRouter = Router();

const authController = new AuthController();

authRouter.post(
  "/login",
  loginValidator,
  handleValidationErrors,
  authController.login
);

authRouter.post(
  "/register",
  registerValidator,
  asyncUtil(authController.register)
);

authRouter.post("/logout", asyncUtil(authController.logout));
authRouter.post("/refresh-token", asyncUtil(authController.refreshToken));
authRouter.post("/forgot-password", asyncUtil(authController.forgotPassword));
authRouter.post("/reset-password", asyncUtil(authController.resetPassword));

export default authRouter;
