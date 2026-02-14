const express = require("express");
const router = express.Router();
const tipController = require("../controller/tipController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", tipController.getAllTips);
router.get("/search", tipController.searchTips);
router.get("/popular", tipController.getPopularTips);
router.get("/category/:category", tipController.getTipsByCategory);
router.get("/:id", tipController.getTipById);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  tipController.createTip
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  tipController.updateTip
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  tipController.deleteTip
);

module.exports = router;