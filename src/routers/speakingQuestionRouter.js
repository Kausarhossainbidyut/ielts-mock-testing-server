const express = require("express");
const router = express.Router();
const speakingQuestionController = require("../controller/speakingQuestionController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", speakingQuestionController.getAllQuestions);
router.get("/random", speakingQuestionController.getRandomQuestions);
router.get("/test/:testId", speakingQuestionController.getQuestionsByTest);
router.get("/:id", speakingQuestionController.getQuestionById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  speakingQuestionController.createQuestion
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  speakingQuestionController.updateQuestion
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  speakingQuestionController.deleteQuestion
);

module.exports = router;