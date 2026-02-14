const express = require("express");
const router = express.Router();
const practiceSessionController = require("../controller/practiceSessionController");
const { authenticate } = require("../middlewares/auth");

// Protected routes - require authentication
router.post("/start", authenticate, practiceSessionController.startSession);
router.get("/active", authenticate, practiceSessionController.getActiveSession);
router.get("/sessions", authenticate, practiceSessionController.getUserSessions);
router.get("/sessions/:id", authenticate, practiceSessionController.getSessionById);
router.get("/sessions/:id/progress", authenticate, practiceSessionController.getSessionProgress);
router.put("/sessions/:id", authenticate, practiceSessionController.updateSession);
router.delete("/sessions/:id", authenticate, practiceSessionController.deleteSession);
router.post("/submit-answers", authenticate, practiceSessionController.submitAnswers);

module.exports = router;