import { CronJob } from "cron";
import logger from "../services/logger";

export abstract class BaseWorker {
  protected cronJob: CronJob | null = null;
  protected isProcessing: boolean = false;
  protected name: string;

  protected constructor(name: string) {
    this.name = name;
  }

  public start(isDev: boolean = false): void {
    if (this.cronJob) {
      logger.info(`${this.name} is already running`);
      return;
    }

    const schedule = this.getSchedule(isDev);
    this.cronJob = new CronJob(
      schedule,
      async () => {
        if (this.isProcessing) {
          logger.info(`${this.name} is already processing`);
          return;
        }

        try {
          this.isProcessing = true;
          logger.info(`Starting ${this.name}`);
          await this.process();
          logger.info(`Completed ${this.name}`);
        } catch (error) {
          logger.error(`Error in ${this.name}:`, error);
        } finally {
          this.isProcessing = false;
        }
      },
      null,
      true,
      "UTC"
    );

    logger.info(`${this.name} started successfully`);
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info(`${this.name} stopped successfully`);
    }
  }

  protected abstract getSchedule(isDev: boolean): string;
  protected abstract process(): Promise<void>;
}
