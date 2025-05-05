import "reflect-metadata";

import "dotenv/config";

import express, { Request, Response } from "express";
import http from "http";
import { ConfigService } from "./src/shared-kernel/env/config-service";
import createSocketIo from "./src/web/socketio/socket-io";
import logger from "./src/shared-kernel/logger/logger";
import initializeBaseConfigForApp from "./src/web/configurations/base-config-for-app";
import initializeInfrastructure from "./src/infras/init-infras";
import routerCommon from "./src/web/routers/common-router";
import { ResponseData } from "./src/web/utils/response-data";
import multer from "multer";
import { printRoutes } from "./src/web/utils/print-routes";

startApp();

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

async function startApp() {
  await initializeInfrastructure();

  const app = express();
  const server = http.createServer(app);
  const PORT = ConfigService.tryGet("SERVER_PORT");

  createSocketIo(server);

  initializeBaseConfigForApp(app);

  app.use("/api", routerCommon);

  app.use(
    (
      err: Error,
      _req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      if (err instanceof multer.MulterError) {
        _res.status(400).send(ResponseData.fail(err.code));
      } else next(err);
    }
  );

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      logger.error(err);
      res.status(500).send(ResponseData.fail("INTERNAL_SERVER_ERROR"));
    }
  );

  app.use((_, res, __) => {
    res.status(404).send(ResponseData.fail("URL_NOT_FOUND"));
  });

  printRoutes(app.router);

  server.listen(PORT, () => {
    logger.info(`Server is listening on port http://localhost:${PORT}`);
  });
}
