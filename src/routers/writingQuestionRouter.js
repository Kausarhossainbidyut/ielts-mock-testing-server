const express = require("express");
const router = express.Router();
const writingQuestionController = require("../controller/writingQuestionController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", writingQuestionController.getAllQuestions);
router.get("/random", writingQuestionController.getRandomQuestions);
router.get("/test/:testId", writingQuestionController.getQuestionsByTest);
router.get("/:id", writingQuestionController.getQuestionById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  writingQuestionController.createQuestion
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  writingQuestionController.updateQuestion
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  writingQuestionController.deleteQuestion
);

module.exports = router;