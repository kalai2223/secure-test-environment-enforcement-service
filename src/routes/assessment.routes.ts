import { Router } from "express";
import controller from "../controllers/assessment.controller";
import { getAllAttempts } from "../services/attempts.service";

const router = Router();

router.get("/:attemptId/check-ip", controller.checkIP);
router.get("/", controller.getAllAttempts);

router.post("/start", controller.startAssessment);
router.post("/:attemptId/submit", controller.submitAttempt);

export default router;
