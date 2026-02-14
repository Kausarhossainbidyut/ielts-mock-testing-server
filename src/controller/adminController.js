const User = require("../models/User.model");
const Test = require("../models/Test.model");
const Question = require("../models/Question.model");
const ListeningQuestion = require("../models/ListeningQuestion.model");
const ReadingQuestion = require("../models/ReadingQuestion.model");
const WritingQuestion = require("../models/WritingQuestion.model");
const SpeakingQuestion = require("../models/SpeakingQuestion.model");
const Resource = require("../models/Resource.model");
const Result = require("../models/Result.model");
const PracticeHistory = require("../models/PracticeHistory.model");
const Analytics = require("../models/Analytics.model");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");

// Get admin dashboard statistics
exports.getAdminDashboard = async (req, res, next) => {
  try {
    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Test statistics
    const testStats = await Test.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Question statistics by type
    const questionStats = await Promise.all([
      { model: ListeningQuestion, name: "listening" },
      { model: ReadingQuestion, name: "reading" },
      { model: WritingQuestion, name: "writing" },
      { model: SpeakingQuestion, name: "speaking" }
    ].map(async (item) => {
      const count = await item.model.countDocuments();
      return { type: item.name, count };
    }));

    // Recent activity
    const recentActivity = await Analytics.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    // System health
    const systemHealth = {
      totalUsers: await User.countDocuments(),
      totalTests: await Test.countDocuments(),
      totalQuestions: questionStats.reduce((sum, stat) => sum + stat.count, 0),
      totalResources: await Resource.countDocuments(),
      activeTests: await Test.countDocuments({ status: "published" }),
      recentRegistrations: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    };

    res.status(200).json({
      success: true,
      data: {
        userStats,
        testStats,
        questionStats,
        systemHealth,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// User management
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// Get user details
exports.getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Get user's activity
    const activity = await Analytics.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get user's test results
    const results = await Result.find({ user: id })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate('test', 'title');

    res.status(200).json({
      success: true,
      data: {
        user,
        activity,
        recentResults: results
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin)
exports.updateUser = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be user or admin"),
  body("verified")
    .optional()
    .isBoolean()
    .withMessage("Verified must be boolean"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const { id } = req.params;
      const updateData = { ...req.body, updatedAt: Date.now() };

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return next(createError(404, "User not found"));
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
];

// Delete user (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return next(createError(403, "Cannot delete admin users"));
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// System analytics
exports.getSystemAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily registrations
    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Test completion rates
    const testCompletion = await PracticeHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          type: "full-test"
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Popular resources
    const popularResources = await Resource.find()
      .sort({ downloads: -1, views: -1 })
      .limit(10)
      .select('title category downloads views');

    // Average scores by skill
    const skillPerformance = await Result.aggregate([
      { $unwind: "$sectionResults" },
      {
        $group: {
          _id: "$sectionResults.skill",
          avgBand: { $avg: "$sectionResults.score.band" },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgBand: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyRegistrations,
        testCompletion,
        popularResources,
        skillPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Manage content (tests, questions, resources)
exports.getContentStats = async (req, res, next) => {
  try {
    const stats = {
      tests: {
        total: await Test.countDocuments(),
        published: await Test.countDocuments({ status: "published" }),
        draft: await Test.countDocuments({ status: "draft" }),
        byType: await Test.aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } }
        ])
      },
      questions: {
        total: await Question.countDocuments(),
        bySkill: await Question.aggregate([
          { $group: { _id: "$skill", count: { $sum: 1 } } }
        ])
      },
      resources: {
        total: await Resource.countDocuments(),
        byCategory: await Resource.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } }
        ]),
        premium: await Resource.countDocuments({ isPremium: true })
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Backup system data
exports.backupData = async (req, res, next) => {
  try {
    const backupData = {
      timestamp: new Date(),
      users: await User.find().select('-password'),
      tests: await Test.find(),
      resources: await Resource.find(),
      // Add other collections as needed
    };

    res.status(200).json({
      success: true,
      message: "Backup data generated successfully",
      data: backupData
    });
  } catch (error) {
    next(error);
  }
};