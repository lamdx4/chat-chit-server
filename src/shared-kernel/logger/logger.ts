import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize, json, errors } = format;

const isDev = process.env.NODE_ENV !== "production";

// 🎨 Format log tùy theo môi trường
const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }), // Log được cả lỗi và stack trace
  json()
);

// 🚀 Tạo logger
const logger = createLogger({
  level: isDev ? "debug" : "info",
  format: isDev ? devFormat : prodFormat,
  transports: [new transports.Console()],
});

export default logger;
