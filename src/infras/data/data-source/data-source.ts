import { DataSource } from "typeorm";
import path from "path";
import { ConfigService } from "../../../shared-kernel/env/config-service";

const AppDataSource = new DataSource({
  type: "mysql",
  host: ConfigService.tryGet("DB_HOST"),
  port: Number(ConfigService.tryGet("DB_PORT")),
  username: ConfigService.tryGet("DB_USERNAME"),
  password: ConfigService.tryGet("DB_PASSWORD"),
  database: ConfigService.tryGet("DB_DATABASE"),
  entities: [path.join(__dirname, "../../../core/entities/*.entity.{js,ts}")],
  synchronize: true,
  subscribers: [path.join(__dirname, "./subscribers/**/*.subscriber.{js,ts}")],
});

export default AppDataSource;
