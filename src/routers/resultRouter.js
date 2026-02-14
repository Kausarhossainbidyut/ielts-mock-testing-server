const express = require("express");
const router = express.Router();
const resultController = require("../controller/resultController");
const { authenticate } = require("../middlewares/auth");

// Protected routes - require authentication
router.post("/submit", authenticate, resultController.submitResult);
router.get("/my-results", authenticate, resultController.getUserResults);
router.get("/statistics", authenticate, resultController.getUserStatistics);
router.get("/leaderboard", resultController.getLeaderboard);
router.get("/:id", authenticate, resultController.getResultById);

module.exports = router;