import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { resolveIP } from "../middleware/ip-resolver";
import { getIPDetails } from "../utils/geoip";
import {
  createAttempt,
  findAttempt,
  getAllAttempts,
  updateAttempt,
} from "../services/attempts.service";
import { logEvent } from "../services/event.service";
import { ASSESSMENT_EVENT_TYPES, ASSESSMENT_STATUS } from "../utils/event";

const {
  CAPTURE_INITIAL_IP,
  CAPTURE_FINAL_IP,
  SUBMITTED,
  IP_CHANGE,
  REGION_CHANGE,
  IP_CHECK_PERFORMED,
  SAME_IP,
  DIFFERENT_IP,
  IP_CHANGE_DETECTED,
  IP_CHANGE_CLASSIFIED,
} = ASSESSMENT_EVENT_TYPES;
const { SUBMIT, IN_PROGRESS } = ASSESSMENT_STATUS;

class AssessmentController {
  constructor() {
    this.buildInitialAttempt = this.buildInitialAttempt.bind(this);
    this.startAssessment = this.startAssessment.bind(this);
    this.checkIP = this.checkIP.bind(this);
    this.submitAttempt = this.submitAttempt.bind(this);
    this.getAllAttempts = this.getAllAttempts.bind(this);
  }
  async startAssessment(req: Request, res: Response) {
    const ip = await resolveIP(req);
    const geo = await getIPDetails(ip);
    const timestamp = Date.now();
    const attemptId = uuid();

    const attempt = this.buildInitialAttempt(
      attemptId,
      ip,
      geo,
      req.headers["user-agent"],
      timestamp,
    );

    await createAttempt(attempt);

    await this.logIPEvent(CAPTURE_INITIAL_IP, attemptId, timestamp, {
      ip,
      ...geo,
    });

    return res.json(attempt);
  }

  async checkIP(req: Request, res: Response) {
    const { attemptId } = req.params as { attemptId: string };
    const attempt = await this.validateAttempt(attemptId, res);

    if (!attempt) return;

    const currentIP = await resolveIP(req);
    const timestamp = Date.now();

    await this.logIPCheck(attempt, currentIP, timestamp);

    if (currentIP === attempt.initialIP) {
      return res.json({ changed: false });
    }

    const newGeo = await getIPDetails(currentIP);

    const classification = this.classifyIPChange(attempt, newGeo);

    await this.logIPChangeEvents(
      attempt,
      currentIP,
      newGeo,
      classification,
      timestamp,
    );

    attempt.ipChangeCount = (attempt.ipChangeCount || 0) + 1;
    await updateAttempt(attempt);

    return res.json({
      changed: true,
      classification,
      newIP: currentIP,
    });
  }

  async submitAttempt(req: Request, res: Response) {
    const { attemptId } = req.params as { attemptId: string };
    const attempt = await this.validateAttempt(attemptId, res);
    if (!attempt) return;

    const finalIP = await resolveIP(req);
    const timestamp = Date.now();

    await this.logIPEvent(CAPTURE_FINAL_IP, attemptId, timestamp, {
      finalIP,
      initialIP: attempt.initialIP,
    });

    attempt.status = SUBMIT;
    attempt.completedAt = timestamp;
    attempt.finalIP = finalIP;

    await this.logIPEvent(SUBMITTED, attemptId, timestamp, {
      ipChangeCount: attempt.ipChangeCount || 0,
    });
    await updateAttempt(attempt);

    return res.json({
      success: true,
      attemptId,
      status: SUBMIT,
      completedAt: timestamp,
    });
  }

  async getAllAttempts(req: Request, res: Response) {
    const attempts = await getAllAttempts();
    res.json({ attempts });
  }
  private buildInitialAttempt(
    attemptId: string,
    ip: string,
    geo: any,
    userAgent: any,
    timestamp: number,
  ) {
    return {
      attemptId,
      initialIP: ip,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      isp: geo.isp,
      userAgent,
      status: IN_PROGRESS,
      createdAt: timestamp,
      ipChangeCount: 0,
    };
  }

  private async validateAttempt(attemptId: string, res: Response) {
    const attempt = await findAttempt(attemptId);

    if (!attempt) {
      res.status(404).json({ message: "Attempt not found" });
      return null;
    }

    if (attempt.status === SUBMIT) {
      res.status(403).json({ message: "Attempt immutable" });
      return null;
    }

    return attempt;
  }

  private classifyIPChange(attempt: any, newGeo: any) {
    if (
      newGeo.country === attempt.country &&
      newGeo.region === attempt.region
    ) {
      return IP_CHANGE;
    }

    return REGION_CHANGE;
  }

  private async logIPCheck(attempt: any, currentIP: string, timestamp: number) {
    await logEvent({
      eventId: uuid(),
      type: IP_CHECK_PERFORMED,
      attemptId: attempt.attemptId,
      timestamp,
      metadata: {
        baselineIP: attempt.initialIP,
        currentIP,
        result: attempt.initialIP === currentIP ? SAME_IP : DIFFERENT_IP,
      },
    });
  }

  private async logIPChangeEvents(
    attempt: any,
    currentIP: string,
    newGeo: any,
    classification: string,
    timestamp: number,
  ) {
    await logEvent({
      eventId: uuid(),
      type: IP_CHANGE_DETECTED,
      attemptId: attempt.attemptId,
      timestamp,
      metadata: {
        oldIP: attempt.initialIP,
        newIP: currentIP,
      },
    });

    await logEvent({
      eventId: uuid(),
      type: IP_CHANGE_CLASSIFIED,
      attemptId: attempt.attemptId,
      timestamp,
      metadata: {
        oldIP: attempt.initialIP,
        newIP: currentIP,
        oldRegion: attempt.region,
        newRegion: newGeo.region,
        classification,
      },
    });
  }

  private async logIPEvent(
    type: string,
    attemptId: string,
    timestamp: number,
    metadata: any,
  ) {
    await logEvent({
      eventId: uuid(),
      type,
      attemptId,
      timestamp,
      metadata,
    });
  }
}

export default new AssessmentController();
