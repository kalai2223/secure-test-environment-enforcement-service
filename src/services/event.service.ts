import fs from "fs";
import path from "path";
import { AssessmentEvent } from "../models/event.types";
import { findAttempt } from "./attempts.service";
import { ASSESSMENT_STATUS } from "../utils/event";

const { SUBMIT } = ASSESSMENT_STATUS;
const filePath = path.join(__dirname, "../../data/events.json");

function readEvents(): AssessmentEvent[] {
  if (!fs?.existsSync(filePath)) return [];
  return JSON.parse(fs?.readFileSync(filePath, "utf-8"));
}

function writeEvents(events: AssessmentEvent[]) {
  fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
}

export async function logEvent(event: AssessmentEvent) {
  const attempt = await findAttempt(event.attemptId);

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status === SUBMIT) {
    throw new Error("Attempt immutable");
  }

  const events = readEvents();
  events.push(event);
  writeEvents(events);
}

// export async function getEventsByAttempt(attemptId: string) {
//   try {
//     const data = fs.readFile(filePath, "utf-8");
//     const events = data ? JSON.parse(data) : [];
//     return events.filter((e: any) => e.attemptId === attemptId);
//   } catch {
//     return [];
//   }
// }
export async function logBatchEvents(events: AssessmentEvent[]) {
  for (const event of events) {
    await logEvent(event);
  }
}

export async function getEventsByAttempt(attemptId: string) {
  const events = readEvents();
  return events
    .filter((e) => e.attemptId === attemptId)
    .sort((a, b) => a.timestamp - b.timestamp);
}
