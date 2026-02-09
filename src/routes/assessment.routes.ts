import { Router } from "express";
import { startAssessment, checkIP } from "../controllers/assessment.controller";

const router = Router();

router.post("/start", startAssessment);
router.get("/:attemptId/check-ip", checkIP);

export default router;
