const Tip = require("../models/Tip.model");
const { body, validationResult } = require("express-validator");

// Get all tips with filtering and pagination
exports.getAllTips = async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    let filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { keywords: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const tips = await Tip.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count for pagination
    const total = await Tip.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Tips retrieved successfully",
      data: {
        tips,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tips",
      error: error.message,
    });
  }
};

// Get tip by ID
exports.getTipById = async (req, res) => {
  try {
    const { id } = req.params;
    const tip = await Tip.findById(id).select("-__v");

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: "Tip not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tip retrieved successfully",
      data: tip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tip",
      error: error.message,
    });
  }
};

// Create new tip (admin only)
exports.createTip = [
  // Validation
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("category")
    .isIn(["listening", "reading", "writing", "speaking"])
    .withMessage("Category must be listening, reading, writing, or speaking"),
  body("difficulty")
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Difficulty must be beginner, intermediate, or advanced"),
  body("content")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),
  body("keywords")
    .optional()
    .isArray()
    .withMessage("Keywords must be an array"),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const tipData = {
        ...req.body,
        createdBy: req.user._id, // From auth middleware
      };

      const tip = new Tip(tipData);
      await tip.save();

      res.status(201).json({
        success: true,
        message: "Tip created successfully",
        data: tip,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating tip",
        error: error.message,
      });
    }
  },
];

// Update tip (admin only)
exports.updateTip = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("category")
    .optional()
    .isIn(["listening", "reading", "writing", "speaking"])
    .withMessage("Category must be listening, reading, writing, or speaking"),
  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Difficulty must be beginner, intermediate, or advanced"),
  body("content")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = { ...req.body, updatedAt: Date.now() };

      const tip = await Tip.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-__v");

      if (!tip) {
        return res.status(404).json({
          success: false,
          message: "Tip not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Tip updated successfully",
        data: tip,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating tip",
        error: error.message,
      });
    }
  },
];

// Delete tip (admin only)
exports.deleteTip = async (req, res) => {
  try {
    const { id } = req.params;
    const tip = await Tip.findByIdAndDelete(id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: "Tip not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tip deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting tip",
      error: error.message,
    });
  }
};

// Get tips by category
exports.getTipsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty, limit = 10 } = req.query;

    const filter = { category };
    if (difficulty) filter.difficulty = difficulty;

    const tips = await Tip.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("-__v");

    res.status(200).json({
      success: true,
      message: `Tips for ${category} retrieved successfully`,
      data: tips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tips by category",
      error: error.message,
    });
  }
};

// Search tips
exports.searchTips = async (req, res) => {
  try {
    const { q, category, difficulty } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const filter = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { keywords: { $regex: q, $options: "i" } },
      ],
    };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const tips = await Tip.find(filter)
      .sort({ relevanceScore: -1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Tips searched successfully",
      data: tips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching tips",
      error: error.message,
    });
  }
};

// Get popular tips (by views or ratings)
exports.getPopularTips = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;

    const tips = await Tip.find(filter)
      .sort({ views: -1, averageRating: -1 })
      .limit(parseInt(limit))
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Popular tips retrieved successfully",
      data: tips,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving popular tips",
      error: error.message,
    });
  }
};