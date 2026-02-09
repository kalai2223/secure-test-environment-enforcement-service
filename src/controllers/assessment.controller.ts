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

  const currentIP = await resolveIP(req);
  const timestamp = Date.now();

  // Always log IP check
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

  // If no change → exit early
  if (currentIP === attempt.initialIP) {
    return res.json({ changed: false });
  }

  // Get geo details for new IP
  const newGeo = await getIPDetails(currentIP);

  // Detect change
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

  // Classification Logic
  let classification = "SUSPICIOUS";

  if (
    newGeo.country === attempt.country &&
    newGeo.region === attempt.region
  ) {
    classification = "LIKELY_BENIGN";
  }

  await logEvent({
    eventId: uuid(),
    type: "IP_CHANGE_CLASSIFIED",
    attemptId,
    timestamp,
    metadata: {
      oldIP: attempt.initialIP,
      newIP: currentIP,
      oldRegion: attempt.region,
      newRegion: newGeo.region,
      classification
    }
  });

  // Increment counter
  attempt.ipChangeCount = (attempt.ipChangeCount || 0) + 1;

  await updateAttempt(attempt);

  return res.json({
    changed: true,
    classification,
    newIP: currentIP
  });
}

