import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { resolveIP } from "../middleware/ip-resolver";
import { getIPDetails } from "../utils/geoip";
import { createAttempt } from "../services/attempts.service";
import { logEvent } from "../services/event.service";
import { findAttempt, updateAttempt } from "../services/attempts.service";

export async function startAssessment(req: Request, res: Response) {
  const ip = await resolveIP(req);

// const ip = "8.8.8.8"; // Google DNS for testing

  const { country, region, city,isp } = await getIPDetails(ip);
  console.log('--> country', country, region, city )

  const attemptId = uuid();
  const timestamp = Date.now();

  const attempt = {
    attemptId,
    initialIP: ip,
    country,
    region,
    city,
    userAgent: req.headers["user-agent"],
    status: "ACTIVE",
    createdAt: timestamp,
    isp
  };

  await createAttempt(attempt);

  await logEvent({
    eventId: uuid(),
    type: "IP_CAPTURED_INITIAL",
    attemptId,
    timestamp,
    metadata: { ip, country, region, city },
  });

  res.json(attempt);
}

export async function checkIP(req: any, res: any) {
  const { attemptId } = req.params;

  const attempt = await findAttempt(attemptId);
  if (!attempt) {
    return res.status(404).json({ message: "Attempt not found" });
  }

  const currentIP = resolveIP(req);
  const timestamp = Date.now();

  // Always log check performed
  await logEvent({
    eventId: uuid(),
    type: "IP_CHECK_PERFORMED",
    attemptId,
    timestamp,
    metadata: {
      baselineIP: attempt.initialIP,
      currentIP
    }
  });

  // Compare with baseline
  if (currentIP !== attempt.initialIP) {
    attempt.ipChangeCount = (attempt.ipChangeCount || 0) + 1;

    await updateAttempt(attempt);

    await logEvent({
      eventId: uuid(),
      type: "IP_CHANGE_DETECTED",
      attemptId,
      timestamp,
      metadata: {
        oldIP: attempt.initialIP,
        newIP: currentIP
      }
    });

    return res.json({ changed: true, currentIP });
  }

  return res.json({ changed: false });
}
