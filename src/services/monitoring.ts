import { Gauge, Counter, Registry } from "prom-client";
import logger from "./logger";

const register = new Registry();

const postMetrics = {
  processingDuration: new Gauge({
    name: "linkedin_post_processing_duration",
    help: "Time taken to process a LinkedIn post",
    labelNames: ["status"],
    registers: [register],
  }),
  postAttempts: new Counter({
    name: "linkedin_post_attempts_total",
    help: "Number of post attempts",
    labelNames: ["status"],
    registers: [register],
  }),
};

export class Monitoring {
  static recordPostMetrics({
    success,
    duration,
    postId,
  }: {
    success: boolean;
    duration: number;
    postId: string;
  }) {
    const status = success ? "success" : "failure";
    postMetrics.processingDuration.labels(status).set(duration);
    postMetrics.postAttempts.labels(status).inc();

    logger.info("Post metrics", {
      postId,
      success,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  static async getMetrics() {
    return register.metrics();
  }
}
