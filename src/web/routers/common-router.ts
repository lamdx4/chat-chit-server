import { Router } from "express";

import authRouter from "../controllers/auth/auth.route";

const routerCommon = Router();

routerCommon.use("/auth", authRouter);

export default routerCommon;
