import { Router } from "express";

import AuthController from "../controllers/auth/auth.controller";

const routerCommon = Router();

routerCommon.use("/auth", new AuthController(routerCommon).getRouter());

export default routerCommon;
