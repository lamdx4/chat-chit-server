import { Redis } from "ioredis";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { ConfigService } from "../../shared-kernel/env/config-service";
import logger from "../../shared-kernel/logger/logger";
import authenticateForSocketMiddleware from "../middlewares/authenticate-for-socket.middleware";

let io: Server | null = null;
export default function getSocketIo(
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) {
  logger.info("Creating Socket.IO server...");

  if (io !== null) {
    logger.warn(
      "Socket.IO server already exists. Returning existing instance."
    );
    return io;
  }
  const redisClient = new Redis({
    host: ConfigService.tryGet("REDIS_ADAPTER_SOCKET_HOST"),
    port: Number(ConfigService.tryGet("REDIS_ADAPTER_SOCKET_PORT")),
  });
  io = new Server(server, {
    cors: {
      origin: ConfigService.tryGet("CORS_ORIGIN"),
      credentials: true,
    },
    adapter: createAdapter(redisClient),
  });
  
  io.use(authenticateForSocketMiddleware);

  io.on("connection", (socket) => {
    console.info("Socket.IO client connected:", socket.data.userId);

    socket.use(([], next) => {
      authenticateForSocketMiddleware(socket, next);
    });

    socket.on("error", (err) => {
      if (err && err.message === "UNAUTHORIZED") {
        socket.disconnect();
      }
    });

    socket.on("disconnect", () => {
      logger.info("Socket.IO client disconnected:", socket.id);
    });
  });
  return io;
}
