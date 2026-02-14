const express = require("express");
const router = express.Router();
const listeningQuestionController = require("../controller/listeningQuestionController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", listeningQuestionController.getAllQuestions);
router.get("/random", listeningQuestionController.getRandomQuestions);
router.get("/test/:testId", listeningQuestionController.getQuestionsByTest);
router.get("/:id", listeningQuestionController.getQuestionById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  listeningQuestionController.createQuestion
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  listeningQuestionController.updateQuestion
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  listeningQuestionController.deleteQuestion
);

module.exports = router;