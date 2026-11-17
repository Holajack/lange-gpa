import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/** Scheduled backend jobs. */
const crons = cronJobs();

// once a day, in the quiet hours for the Americas
crons.daily("retention sweep", { hourUTC: 9, minuteUTC: 0 }, internal.retention.sweep);

export default crons;
