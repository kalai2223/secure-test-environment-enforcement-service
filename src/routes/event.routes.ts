import { Router } from "express";
import controller from "../controllers/event.controller";

const router = Router();

router.get("/has-warning/:attemptId", controller.hasWarning);
router.get("/attempt/:attemptId", controller.getAttempt);

router.post("/warning-shown", controller.showWarning);
router.post("/batch", controller.batch);

// Employer audit retrieval
router.get("/:attemptId", controller.getAttempt);
router.get("/", controller.getAllAttempts);

export default router;
