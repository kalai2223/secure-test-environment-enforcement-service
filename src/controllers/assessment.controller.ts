import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { resolveIP } from "../middleware/ip-resolver";
import { getIPDetails } from "../utils/geoip";
import { createAttempt } from "../services/attempts.service";
import { logEvent } from "../services/event.service";

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
