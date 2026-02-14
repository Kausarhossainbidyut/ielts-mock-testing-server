const User = require("../models/User.model");
const PracticeHistory = require("../models/PracticeHistory.model");
const Analytics = require("../models/Analytics.model");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");

// Get user dashboard data
exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user profile
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Get practice statistics
    const practiceStats = await PracticeHistory.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: { $cond: [{ $eq: ["$type", "full-test"] }, 1, 0] } },
          totalPractice: { $sum: { $cond: [{ $ne: ["$type", "full-test"] }, 1, 0] } },
          avgScore: { $avg: "$score.band" },
          totalTime: { $sum: "$duration" },
          completedTests: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
        }
      }
    ]);

    // Get skill-wise performance
    const skillPerformance = await PracticeHistory.aggregate([
      { $match: { user: userId, status: "completed" } },
      { $unwind: "$answers" },
      {
        $group: {
          _id: "$skill",
          totalQuestions: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
          avgTime: { $avg: "$answers.timeTaken" }
        }
      },
      {
        $project: {
          skill: "$_id",
          accuracy: { $multiply: [{ $divide: ["$correctAnswers", "$totalQuestions"] }, 100] },
          avgTime: 1,
          totalQuestions: 1
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await PracticeHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('test', 'title type')
      .select('type skill score status createdAt');

    // Get weak areas
    const weakAreas = skillPerformance
      .filter(skill => skill.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    res.status(200).json({
      success: true,
      data: {
        user,
        statistics: practiceStats[0] || {
          totalTests: 0,
          totalPractice: 0,
          avgScore: 0,
          totalTime: 0,
          completedTests: 0
        },
        skillPerformance,
        recentActivity,
        weakAreas
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("targetBand")
    .optional()
    .isFloat({ min: 0, max: 9 })
    .withMessage("Target band must be between 0 and 9"),
  body("currentLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Level must be beginner, intermediate, or advanced"),
  body("examDate")
    .optional()
    .isISO8601()
    .withMessage("Exam date must be a valid date"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const userId = req.userId;
      const updateData = { ...req.body, updatedAt: Date.now() };

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return next(createError(404, "User not found"));
      }

      // Log profile update
      await Analytics.create({
        user: userId,
        action: "profile_updated",
        metadata: { fields: Object.keys(req.body) }
      });

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
];

// Get user's test history
exports.getTestHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, skill } = req.query;
    const userId = req.userId;

    let filter = { user: userId, type: "full-test" };
    if (status) filter.status = status;
    if (skill) filter.skill = skill;

    const tests = await PracticeHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('test', 'title type duration')
      .select('-answers');

    const total = await PracticeHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        tests,
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

// Get user's practice history
exports.getPracticeHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, skill, type } = req.query;
    const userId = req.userId;

    let filter = { user: userId };
    if (skill) filter.skill = skill;
    if (type) filter.type = type;
    if (type !== "full-test") filter.type = { $ne: "full-test" };

    const practices = await PracticeHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('section', 'title skill')
      .populate('question', 'content type')
      .select('type skill score status startTime endTime duration createdAt');

    const total = await PracticeHistory.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        practices,
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

// Get user analytics and progress
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Daily practice trend
    const dailyTrend = await PracticeHistory.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$score.band" },
          totalTime: { $sum: "$duration" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Skill distribution
    const skillDistribution = await PracticeHistory.aggregate([
      {
        $match: {
          user: userId,
          status: "completed",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$skill",
          count: { $sum: 1 },
          avgScore: { $avg: "$score.band" }
        }
      }
    ]);

    // Performance improvement
    const performanceImprovement = await PracticeHistory.aggregate([
      {
        $match: {
          user: userId,
          status: "completed",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          firstAvg: { $avg: { $cond: [{ $lt: ["$createdAt", new Date(Date.now() - (days/2) * 24 * 60 * 60 * 1000)] }, "$score.band", null] } },
          secondAvg: { $avg: { $cond: [{ $gte: ["$createdAt", new Date(Date.now() - (days/2) * 24 * 60 * 60 * 1000)] }, "$score.band", null] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyTrend,
        skillDistribution,
        performanceImprovement: performanceImprovement[0] || { firstAvg: 0, secondAvg: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Save resource to user's library
exports.saveResource = async (req, res, next) => {
  try {
    const { resourceId } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (!user.savedResources.includes(resourceId)) {
      user.savedResources.push(resourceId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Resource saved successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get saved resources
exports.getSavedResources = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId).populate('savedResources');
    
    res.status(200).json({
      success: true,
      data: user.savedResources || []
    });
  } catch (error) {
    next(error);
  }
};