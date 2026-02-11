import { getEventsByAttempt, logEvent } from "../services/event.service";

import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { getAllAttempts } from "../services/attempts.service";

import { ASSESSMENT_EVENT_TYPES } from "../utils/event";
import { resolveIP } from "../middleware/ip-resolver";

const { IP_CHANGE_WARNING_SHOWN } = ASSESSMENT_EVENT_TYPES;
class EventController {
  async showWarning(req: Request, res: Response) {
    const {
      attemptId,
      type,
      timestamp,
      classification,
      oldGeo,
      newGeo,
      oldIP,
      newIP,
    } = req.body;

    await logEvent({
      eventId: uuid(),
      type,
      attemptId,
      timestamp,
      metadata: { classification, oldGeo, newGeo, oldIP, newIP },
    });

    res.json({ success: true });
  }

  async hasWarning(req: Request, res: Response) {
    const { attemptId } = req.params as { attemptId: string };
    // const { currentIP } = req.query as { currentIP: string };
    const currentIP = await resolveIP(req);

    if (!currentIP) {
      return res.status(400).json({ message: "currentIP is required" });
    }

    const events = await getEventsByAttempt(attemptId);

    const warningExists = events.some((e: any) => {
      return (
        e.type === IP_CHANGE_WARNING_SHOWN && e.metadata?.newIP === currentIP
      );
    });

    res.json({ warningShown: warningExists });
  }

  async batch(req: Request, res: Response) {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    for (const event of events) {
      await logEvent(event);
    }

    res.json({ success: true });
  }

  async getAttempt(req: Request, res: Response) {
    const { attemptId } = req.params as { attemptId: string };

    const events = await getEventsByAttempt(attemptId);

    events.sort((a: any, b: any) => a.timestamp - b.timestamp);

    res.json({ events });
  }

  async getAllAttempts(req: Request, res: Response) {
    const attempts = await getAllAttempts();
    res.json({ attempts });
  }
}

export default new EventController();
