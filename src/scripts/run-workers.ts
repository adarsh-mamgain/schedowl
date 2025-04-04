import { WorkerOrchestrator } from "../workers/worker-orchestrator";
import logger from "../services/logger";

// Check if running in production mode
const isProd = process.env.NODE_ENV === "production";

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  WorkerOrchestrator.getInstance(isProd).stop();
  process.exit(1);
});

// Start the worker orchestrator
WorkerOrchestrator.getInstance(isProd).start();
