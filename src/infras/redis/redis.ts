import Redis from "ioredis";
import { ConfigService } from "../../shared-kernel/env/config-service";
import logger from "../../shared-kernel/logger/logger";

let redis: Redis | null = null;

const getRedisClient = () => {
  if (!redis) {
    redis = new Redis({
      host: ConfigService.tryGet("REDIS_CACHE_HOST"),
      port: Number(ConfigService.tryGet("REDIS_CACHE_PORT")),
      lazyConnect: true,
    });

    redis.on("connect", () => {
      logger.info("Redis connected");
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }
  return redis;
};

export default getRedisClient;
