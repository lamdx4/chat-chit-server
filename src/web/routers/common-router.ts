import { Router } from "express";

import authRouter from "../controllers/auth/auth.route";

import userRouter from "../controllers/user/user.route";

const routerCommon = Router();

routerCommon.use("/auth", authRouter);

routerCommon.use("/user", userRouter);

export default routerCommon;