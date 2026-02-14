const Test = require("../models/Test.model");
const { body, validationResult } = require("express-validator");

// GET /api/tests - Get all tests with filtering and pagination
exports.getAllTests = async (req, res) => {
  try {
    const {
      type,
      difficulty,
      status,
      skill,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    let filter = {};
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (skill) filter.skills = { $in: [skill] };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { testId: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const tests = await Test.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count for pagination
    const total = await Test.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Tests retrieved successfully",
      data: {
        tests,
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
      message: "Error retrieving tests",
      error: error.message,
    });
  }
};

// GET /api/tests/:id - Get test by ID
exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id)
      .select("-__v");

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Increment popularity
    test.popularity = (test.popularity || 0) + 1;
    await test.save();

    res.status(200).json({
      success: true,
      message: "Test retrieved successfully",
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving test",
      error: error.message,
    });
  }
};

// POST /api/tests - Create new test (admin only)
exports.createTest = [
  // Validation
  body("testId")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Test ID is required")
    .custom(async (value) => {
      const existingTest = await Test.findOne({ testId: value });
      if (existingTest) {
        throw new Error("Test ID already exists");
      }
      return true;
    }),
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("type")
    .isIn(["full-mock", "practice", "mini", "daily"])
    .withMessage("Type must be full-mock, practice, mini, or daily"),
  body("skills")
    .isArray({ min: 1 })
    .withMessage("Skills array is required"),
  body("skills.*")
    .isIn(["listening", "reading", "writing", "speaking"])
    .withMessage("Skills must be listening, reading, writing, or speaking"),
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard", "exam"])
    .withMessage("Difficulty must be easy, medium, hard, or exam"),
  body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive number"),
  body("sections")
    .optional()
    .isArray()
    .withMessage("Sections must be an array of ObjectIds"),
  body("source")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Source must be less than 100 characters"),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),

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

      const testData = {
        ...req.body,
        createdBy: req.user?._id, // From auth middleware if available
      };

      const test = new Test(testData);
      await test.save();

      res.status(201).json({
        success: true,
        message: "Test created successfully",
        data: test,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating test",
        error: error.message,
      });
    }
  },
];

// PUT /api/tests/:id - Update test (admin only)
exports.updateTest = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("type")
    .optional()
    .isIn(["full-mock", "practice", "mini", "daily"])
    .withMessage("Type must be full-mock, practice, mini, or daily"),
  body("skills")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Skills array is required"),
  body("skills.*")
    .optional()
    .isIn(["listening", "reading", "writing", "speaking"])
    .withMessage("Skills must be listening, reading, writing, or speaking"),
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard", "exam"])
    .withMessage("Difficulty must be easy, medium, hard, or exam"),
  body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive number"),
  body("sections")
    .optional()
    .isArray()
    .withMessage("Sections must be an array of ObjectIds"),
  body("source")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Source must be less than 100 characters"),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Status must be draft, published, or archived"),

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

      const test = await Test.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .select("-__v");

      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Test updated successfully",
        data: test,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating test",
        error: error.message,
      });
    }
  },
];

// DELETE /api/tests/:id - Delete test (admin only)
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findByIdAndDelete(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting test",
      error: error.message,
    });
  }
};

// GET /api/tests/popular - Get popular tests
exports.getPopularTests = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const tests = await Test.find({ status: "published" })
      .sort({ popularity: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Popular tests retrieved successfully",
      data: tests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving popular tests",
      error: error.message,
    });
  }
};

// GET /api/tests/type/:type - Get tests by type
exports.getTestsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { difficulty, status, limit = 10 } = req.query;

    const filter = { type };
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;

    const tests = await Test.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("-__v");

    res.status(200).json({
      success: true,
      message: `Tests of type ${type} retrieved successfully`,
      data: tests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tests by type",
      error: error.message,
    });
  }
};