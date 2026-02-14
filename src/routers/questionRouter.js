const express = require("express");
const router = express.Router();
const questionController = require("../controller/questionController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", questionController.getAllQuestions);
router.get("/random", questionController.getRandomQuestions);
router.get("/test/:testId", questionController.getQuestionsByTest);
router.get("/:id", questionController.getQuestionById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  questionController.createQuestion
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  questionController.updateQuestion
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  questionController.deleteQuestion
);

module.exports = router;