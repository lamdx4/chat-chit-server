import { Router } from "express";
import GroupController from "./group.controller";
import asyncUtil from "../../utils/async-wrapper";
import authenticateMiddleware from "../../middlewares/authenticate.middleware";
import handleValidationErrors from "../../utils/handle-validation-errors";
import createGroupValidator from "./validators/create-group.validate";

let groupRouter = Router();

const groupController = new GroupController();

groupRouter.post(
  "/create",
  authenticateMiddleware,
  createGroupValidator,
  handleValidationErrors,
  asyncUtil(groupController.createGroup.bind(groupController))
);
export default groupRouter;