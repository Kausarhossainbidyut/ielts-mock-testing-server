const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { authenticate } = require("../middlewares/auth");

// Protected routes - require authentication
router.get("/dashboard", authenticate, userController.getUserDashboard);
router.put("/profile", authenticate, userController.updateProfile);
router.get("/tests/history", authenticate, userController.getTestHistory);
router.get("/practice/history", authenticate, userController.getPracticeHistory);
router.get("/analytics", authenticate, userController.getUserAnalytics);
router.post("/resources/save", authenticate, userController.saveResource);
router.get("/resources/saved", authenticate, userController.getSavedResources);

module.exports = router;