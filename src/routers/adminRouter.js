const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Admin routes (protected)
router.get("/dashboard", authenticate, authorizeRoles("admin"), adminController.getAdminDashboard);
router.get("/users", authenticate, authorizeRoles("admin"), adminController.getAllUsers);
router.get("/users/:id", authenticate, authorizeRoles("admin"), adminController.getUserDetails);
router.put("/users/:id", authenticate, authorizeRoles("admin"), adminController.updateUser);
router.delete("/users/:id", authenticate, authorizeRoles("admin"), adminController.deleteUser);
router.get("/analytics", authenticate, authorizeRoles("admin"), adminController.getSystemAnalytics);
router.get("/content-stats", authenticate, authorizeRoles("admin"), adminController.getContentStats);
router.get("/backup", authenticate, authorizeRoles("admin"), adminController.backupData);

module.exports = router;