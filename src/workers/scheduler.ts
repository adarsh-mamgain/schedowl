import { schedulerService } from "../services/scheduler";
import logger from "../services/logger";

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down scheduler...");
  schedulerService.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down scheduler...");
  schedulerService.stop();
  process.exit(0);
});

// Start the scheduler
schedulerService.start();
