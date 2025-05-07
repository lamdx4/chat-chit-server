import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path from "path";
import { ConfigService } from "../../shared-kernel/env/config-service";

export default function initializeBaseConfigForApp(app: express.Express) {
  app.use(
    cors({
      origin: ConfigService.tryGet("CORS_ORIGIN"),
    })
  );

  app.use(helmet());

  app.use(morgan("combined"));

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(compression());

  app.use((_, res, next) => {
    res.setHeader("X-Powered-By", "Chat Server");
    next();
  });
}
