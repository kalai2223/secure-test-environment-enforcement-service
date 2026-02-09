import { Router } from "express";
import { startAssessment } from "../controllers/assessment.controller";

const router = Router();

router.post("/start", startAssessment);

export default router;
