import AppDataSource from "./data/data-source/data-source";
import logger from "../shared-kernel/logger/logger";
import getRedisClient from "./redis/redis";

const initializeInfrastructure = async () => {
  try {
    await AppDataSource.initialize();
    await getRedisClient().connect();
  } catch (error) {
    logger.error("Error during Infras initialization:", error);
    process.exit(1);
  }
  logger.info("Infrastructure initialized successfully");
};
export default initializeInfrastructure;
