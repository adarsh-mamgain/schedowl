import logger from "../services/logger";
import { BaseWorker } from "./base-worker";
import { SubscriptionWorker } from "./subscription-worker";
import { SchedulerWorker } from "./scheduler-worker";

export class WorkerOrchestrator {
  private static _instance: WorkerOrchestrator;
  private workers: Map<string, BaseWorker>;
  private isDev: boolean;

  private constructor(isDev: boolean = false) {
    this.isDev = isDev;
    this.workers = new Map();
    this.initializeWorkers();
  }

  public static getInstance(isDev: boolean = false): WorkerOrchestrator {
    if (!WorkerOrchestrator._instance) {
      WorkerOrchestrator._instance = new WorkerOrchestrator(isDev);
    }
    return WorkerOrchestrator._instance;
  }

  private initializeWorkers(): void {
    // Initialize all workers
    this.workers.set("subscription", SubscriptionWorker.getInstance());
    this.workers.set("scheduler", SchedulerWorker.getInstance());
  }

  public start(): void {
    logger.info(
      `Starting workers in ${this.isDev ? "development" : "production"} mode`
    );

    // Start all workers
    this.workers.forEach((worker, name) => {
      try {
        worker.start(this.isDev);
        logger.info(`Started ${name} worker`);
      } catch (error) {
        logger.error(`Failed to start ${name} worker:`, error);
      }
    });

    // Handle graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down workers...");
      this.stop();
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received. Shutting down workers...");
      this.stop();
      process.exit(0);
    });
  }

  public stop(): void {
    logger.info("Stopping all workers...");
    this.workers.forEach((worker, name) => {
      try {
        worker.stop();
        logger.info(`Stopped ${name} worker`);
      } catch (error) {
        logger.error(`Failed to stop ${name} worker:`, error);
      }
    });
    logger.info("All workers stopped");
  }
}
