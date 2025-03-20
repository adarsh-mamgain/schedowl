type ShutdownHandlers = {
  cleanup?: () => Promise<void>;
  logger?: (message: string) => void;
};

export const setupGracefulShutdown = ({
  cleanup,
  logger = console.log,
}: ShutdownHandlers) => {
  const handleShutdown = async (signal: string) => {
    logger(`Received ${signal}. Starting graceful shutdown...`);

    if (cleanup) {
      try {
        await cleanup();
        logger("Cleanup completed successfully");
      } catch (error) {
        logger(
          `Error during cleanup: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Notify PM2 about successful shutdown
    if (process.send) {
      process.send("ready");
      logger("Sent ready signal to PM2");
    }

    // Exit after a short delay to ensure logs are flushed
    setTimeout(() => {
      process.exit(0);
    }, 100);
  };

  // Handle different termination signals
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));

  // Handle PM2 shutdown message
  process.on("message", (message) => {
    if (message === "shutdown") {
      handleShutdown("PM2 shutdown");
    }
  });
};
