import { postQueue } from "../src/services/queue";

async function checkWorkerHealth() {
  try {
    // Check if Redis connection is alive
    const isRedisOk = await postQueue.isReady();

    if (!isRedisOk) {
      console.error("Redis connection is not ready");
      process.exit(1);
    }

    // Check if worker process exists
    const workerCount = await postQueue.getWorkers();
    if (workerCount.length === 0) {
      console.error("No active workers found");
      process.exit(1);
    }

    console.log("Worker health check passed");
    process.exit(0);
  } catch (error) {
    console.error("Health check failed:", error);
    process.exit(1);
  }
}

checkWorkerHealth();
