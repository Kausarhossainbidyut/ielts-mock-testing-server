const express = require("express");
const router = express.Router();
const testController = require("../controller/testController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", testController.getAllTests);
router.get("/popular", testController.getPopularTests);
router.get("/type/:type", testController.getTestsByType);
router.get("/:id", testController.getTestById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  testController.createTest
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  testController.updateTest
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  testController.deleteTest
);

module.exports = router;