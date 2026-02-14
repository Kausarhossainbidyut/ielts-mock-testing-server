const Result = require("../models/Result.model");
const PracticeHistory = require("../models/PracticeHistory.model");
const Test = require("../models/Test.model");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");

// Submit test result
exports.submitResult = [
  body("test")
    .notEmpty()
    .withMessage("Test ID is required"),
  body("answers")
    .isArray()
    .withMessage("Answers must be an array"),
  body("timeTaken")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Time taken must be a positive number"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const { test, answers, timeTaken } = req.body;
      const userId = req.userId;

      // Verify test exists
      const testDoc = await Test.findById(test);
      if (!testDoc) {
        return next(createError(404, "Test not found"));
      }

      // Calculate scores
      const resultData = await calculateScores(test, answers, timeTaken);
      
      const result = new Result({
        user: userId,
        test,
        answers,
        ...resultData,
        submittedAt: new Date()
      });

      await result.save();

      // Update practice history
      await PracticeHistory.create({
        user: userId,
        test,
        type: "full-test",
        skill: "overall",
        startTime: result.startedAt,
        endTime: result.submittedAt,
        duration: timeTaken,
        answers: answers.map((ans, index) => ({
          questionId: ans.questionId,
          answer: ans.answer,
          isCorrect: result.sectionResults.some(sec => 
            sec.questions.some(q => q.questionId.toString() === ans.questionId.toString() && q.isCorrect)
          ),
          timeTaken: ans.timeTaken
        })),
        score: {
          raw: result.totalScore.raw,
          band: result.totalScore.band,
          percentage: result.totalScore.percentage
        },
        status: "completed",
        submittedAnswers: answers
      });

      res.status(201).json({
        success: true,
        message: "Result submitted successfully",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
];

// Get user's results
exports.getUserResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, test } = req.query;
    const userId = req.userId;

    let filter = { user: userId };
    if (test) filter.test = test;

    const results = await Result.find(filter)
      .sort({ submittedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('test', 'title type')
      .select('-answers');

    const total = await Result.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        results,
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

// Get result by ID
exports.getResultById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await Result.findById(id)
      .populate('test', 'title type duration')
      .select('-__v');

    if (!result) {
      return next(createError(404, "Result not found"));
    }

    // Check if user owns this result
    if (result.user.toString() !== userId.toString()) {
      return next(createError(403, "Access denied"));
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get user's performance statistics
exports.getUserStatistics = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { days = 90 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Overall statistics
    const stats = await Result.aggregate([
      { $match: { user: userId, submittedAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgOverallBand: { $avg: "$totalScore.band" },
          highestBand: { $max: "$totalScore.band" },
          lowestBand: { $min: "$totalScore.band" },
          totalTime: { $sum: "$timeTaken" }
        }
      }
    ]);

    // Skill-wise performance
    const skillStats = await Result.aggregate([
      { $match: { user: userId, submittedAt: { $gte: startDate } } },
      { $unwind: "$sectionResults" },
      {
        $group: {
          _id: "$sectionResults.skill",
          avgBand: { $avg: "$sectionResults.score.band" },
          highestBand: { $max: "$sectionResults.score.band" },
          testCount: { $sum: 1 }
        }
      },
      { $sort: { avgBand: -1 } }
    ]);

    // Progress over time
    const progressData = await Result.aggregate([
      { $match: { user: userId, submittedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
          },
          avgBand: { $avg: "$totalScore.band" },
          testCount: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalTests: 0,
          avgOverallBand: 0,
          highestBand: 0,
          lowestBand: 0,
          totalTime: 0
        },
        bySkill: skillStats,
        progress: progressData
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard (top performers)
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const leaderboard = await Result.aggregate([
      {
        $match: {
          submittedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$user",
          avgBand: { $avg: "$totalScore.band" },
          testCount: { $sum: 1 },
          latestTest: { $max: "$submittedAt" }
        }
      },
      { $sort: { avgBand: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          userId: "$_id",
          name: "$userInfo.name",
          avgBand: 1,
          testCount: 1,
          latestTest: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate scores
async function calculateScores(testId, answers, timeTaken) {
  // This would typically involve complex scoring logic
  // For now, providing a simplified version
  
  const correctAnswers = answers.filter(ans => ans.isCorrect).length;
  const totalQuestions = answers.length;
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  // Simplified band conversion (would be more complex in reality)
  let bandScore;
  if (percentage >= 90) bandScore = 9.0;
  else if (percentage >= 80) bandScore = 8.0;
  else if (percentage >= 70) bandScore = 7.0;
  else if (percentage >= 60) bandScore = 6.0;
  else if (percentage >= 50) bandScore = 5.0;
  else bandScore = 4.0;

  return {
    totalScore: {
      raw: correctAnswers,
      band: bandScore,
      percentage: parseFloat(percentage.toFixed(1))
    },
    sectionResults: [], // Would be populated with section-wise results
    timeTaken: timeTaken || 0,
    startedAt: new Date(Date.now() - (timeTaken || 0) * 1000)
  };
}