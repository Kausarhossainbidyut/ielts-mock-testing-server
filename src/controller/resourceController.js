const Resource = require("../models/Resource.model");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");

// Get all resources with filtering
exports.getAllResources = async (req, res, next) => {
  try {
    const {
      category,
      skill,
      type,
      level,
      isPremium,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 12
    } = req.query;

    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (skill) filter.skill = skill;
    if (type) filter.type = type;
    if (level) filter.level = level;
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const resources = await Resource.find(filter)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Resource.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        resources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get resource by ID
exports.getResourceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id).select('-__v');
    
    if (!resource) {
      return next(createError(404, "Resource not found"));
    }

    // Increment views count
    resource.views += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    next(error);
  }
};

// Create new resource (admin only)
exports.createResource = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("category")
    .isIn(["cambridge", "practice", "vocabulary", "grammar", "speaking", "writing", "listening", "reading", "general"])
    .withMessage("Invalid category"),
  body("skill")
    .isIn(["listening", "reading", "writing", "speaking", "general"])
    .withMessage("Invalid skill"),
  body("type")
    .isIn(["book", "pdf", "audio", "video", "link", "practice-material"])
    .withMessage("Invalid resource type"),
  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced", "all"])
    .withMessage("Invalid level"),
  body("fileUrl")
    .optional()
    .isURL()
    .withMessage("Invalid file URL"),
  body("externalLink")
    .optional()
    .isURL()
    .withMessage("Invalid external link"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const resourceData = {
        ...req.body,
        createdBy: req.user._id
      };

      const resource = new Resource(resourceData);
      await resource.save();

      res.status(201).json({
        success: true,
        message: "Resource created successfully",
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }
];

// Update resource (admin only)
exports.updateResource = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("category")
    .optional()
    .isIn(["cambridge", "practice", "vocabulary", "grammar", "speaking", "writing", "listening", "reading", "general"])
    .withMessage("Invalid category"),
  body("skill")
    .optional()
    .isIn(["listening", "reading", "writing", "speaking", "general"])
    .withMessage("Invalid skill"),
  body("type")
    .optional()
    .isIn(["book", "pdf", "audio", "video", "link", "practice-material"])
    .withMessage("Invalid resource type"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const { id } = req.params;
      const updateData = { ...req.body, updatedAt: Date.now() };

      const resource = await Resource.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!resource) {
        return next(createError(404, "Resource not found"));
      }

      res.status(200).json({
        success: true,
        message: "Resource updated successfully",
        data: resource
      });
    } catch (error) {
      next(error);
    }
  }
];

// Delete resource (admin only)
exports.deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findByIdAndDelete(id);
    
    if (!resource) {
      return next(createError(404, "Resource not found"));
    }

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Download resource (increment download count)
exports.downloadResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return next(createError(404, "Resource not found"));
    }

    // Increment downloads count
    resource.downloads += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      message: "Download tracked successfully",
      data: {
        resourceId: resource._id,
        title: resource.title,
        downloadUrl: resource.fileUrl || resource.externalLink
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get popular resources
exports.getPopularResources = async (req, res, next) => {
  try {
    const { limit = 10, category, skill } = req.query;

    let filter = { isActive: true };
    if (category) filter.category = category;
    if (skill) filter.skill = skill;

    const resources = await Resource.find(filter)
      .sort({ downloads: -1, views: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

// Get resources by category
exports.getResourcesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { skill, level, limit = 12 } = req.query;

    const filter = { category, isActive: true };
    if (skill) filter.skill = skill;
    if (level) filter.level = level;

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-__v');

    res.status(200).json({
      success: true,
      data: resources
    });
  } catch (error) {
    next(error);
  }
};

// Rate resource
exports.rateResource = [
  body("rating")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const { id } = req.params;
      const { rating } = req.body;

      const resource = await Resource.findById(id);
      
      if (!resource) {
        return next(createError(404, "Resource not found"));
      }

      // Update rating (simple average calculation)
      const currentTotal = resource.rating.average * resource.rating.count;
      const newCount = resource.rating.count + 1;
      const newAverage = (currentTotal + parseFloat(rating)) / newCount;

      resource.rating.average = parseFloat(newAverage.toFixed(1));
      resource.rating.count = newCount;
      
      await resource.save();

      res.status(200).json({
        success: true,
        message: "Resource rated successfully",
        data: {
          averageRating: resource.rating.average,
          totalRatings: resource.rating.count
        }
      });
    } catch (error) {
      next(error);
    }
  }
];