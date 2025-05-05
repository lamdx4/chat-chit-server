import { Redis } from "ioredis";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { ConfigService } from "../../shared-kernel/env/config-service";
import logger from "../../shared-kernel/logger/logger";

export default function createSocketIo(
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) {
  logger.info("Creating Socket.IO server...");
  const redisClient = new Redis({
    host: ConfigService.tryGet("REDIS_ADAPTER_SOCKET_HOST"),
    port: Number(ConfigService.tryGet("REDIS_ADAPTER_SOCKET_PORT")),
  });
  const io = new Server(server, {
    cors: {
      origin: ConfigService.tryGet("CORS_ORIGIN"),
      credentials: true,
    },
    adapter: createAdapter(redisClient),
  });
  return io;
}
