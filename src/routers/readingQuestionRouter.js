const express = require("express");
const router = express.Router();
const readingQuestionController = require("../controller/readingQuestionController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", readingQuestionController.getAllQuestions);
router.get("/random", readingQuestionController.getRandomQuestions);
router.get("/test/:testId", readingQuestionController.getQuestionsByTest);
router.get("/:id", readingQuestionController.getQuestionById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  readingQuestionController.createQuestion
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  readingQuestionController.updateQuestion
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  readingQuestionController.deleteQuestion
);

module.exports = router;