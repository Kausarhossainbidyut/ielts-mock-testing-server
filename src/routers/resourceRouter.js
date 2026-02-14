const express = require("express");
const router = express.Router();
const resourceController = require("../controller/resourceController");
const { authenticate, authorizeRoles } = require("../middlewares/auth");

// Public routes
router.get("/", resourceController.getAllResources);
router.get("/popular", resourceController.getPopularResources);
router.get("/category/:category", resourceController.getResourcesByCategory);
router.get("/:id", resourceController.getResourceById);
router.post("/:id/download", resourceController.downloadResource);
router.post("/:id/rate", authenticate, resourceController.rateResource);

// Admin routes (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  resourceController.createResource
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  resourceController.updateResource
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  resourceController.deleteResource
);

module.exports = router;