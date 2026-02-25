import "./pushWorker";
import "./analyticsWorker";
import "./rssWorker";
import "./webhookWorker";
import { registerRecurringJobs } from "../services/scheduler";

registerRecurringJobs()
  .then(() => {
    console.log("PulsePress workers started and recurring jobs registered");
  })
  .catch((error) => {
    console.error("Failed to register recurring jobs", error);
    process.exit(1);
  });
