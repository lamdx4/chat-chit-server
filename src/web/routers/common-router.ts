import { Router } from "express";

import authRouter from "../controllers/auth/auth.route";

import userRouter from "../controllers/user/user.route";

import groupRouter from "../controllers/group/group.route";

const routerCommon = Router();

routerCommon.use("/auth", authRouter);

routerCommon.use("/user", userRouter);

routerCommon.use("/group", groupRouter);

export default routerCommon;