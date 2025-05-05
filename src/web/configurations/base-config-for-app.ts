import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import logger from "../../shared-kernel/logger/logger";
import { ResponseData } from "../utils/response-data";

export default function initializeBaseConfigForApp(app: express.Express) {
  
  app.use(cors());

  app.use(helmet());

  app.use(morgan("combined"));

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.use(compression());

  app.use((_, res, next) => {
    res.setHeader("X-Powered-By", "Chat Server");
    next();
  });
}
