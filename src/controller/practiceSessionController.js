const PracticeHistory = require("../models/PracticeHistory.model");
const createError = require("http-errors");

// Start a new practice session
exports.startSession = async (req, res, next) => {
  try {
    const { test, section, question, type, skill } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!type) {
      return next(createError(400, "Practice type is required"));
    }

    const sessionData = {
      user: userId,
      type,
      startTime: new Date(),
      status: "started"
    };

    // Add optional fields if provided
    if (test) sessionData.test = test;
    if (section) sessionData.section = section;
    if (question) sessionData.question = question;
    if (skill) sessionData.skill = skill;

    const session = new PracticeHistory(sessionData);
    await session.save();

    // Populate references for response
    await session.populate('test', 'title type');
    await session.populate('section', 'title skill');
    await session.populate('question', 'content type');

    res.status(201).json({
      success: true,
      message: "Practice session started successfully",
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// Update practice session with answers
exports.updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, status, endTime } = req.body;
    const userId = req.userId;

    // Find session
    const session = await PracticeHistory.findById(id);
    if (!session) {
      return next(createError(404, "Practice session not found"));
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      return next(createError(403, "Access denied"));
    }

    // Update session data
    const updateData = {
      updatedAt: Date.now()
    };

    if (answers) {
      // Validate and format answers
      const formattedAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect: answer.isCorrect || false,
        timeTaken: answer.timeTaken || 0
      }));
      updateData.answers = formattedAnswers;
    }

    if (status) {
      updateData.status = status;
      // If completing session, set end time
      if (status === "completed" && !endTime) {
        updateData.endTime = new Date();
        updateData.duration = Math.floor((new Date() - session.startTime) / 1000);
      }
    }

    if (endTime) {
      updateData.endTime = new Date(endTime);
      updateData.duration = Math.floor((new Date(endTime) - session.startTime) / 1000);
    }

    // Update session
    const updatedSession = await PracticeHistory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('test', 'title type')
      .populate('section', 'title skill')
      .populate('question', 'content type')
      .select('-__v');

    res.status(200).json({
      success: true,
      message: "Practice session updated successfully",
      data: updatedSession
    });
  } catch (error) {
    next(error);
  }
};

// Get active session for user
exports.getActiveSession = async (req, res, next) => {
  try {
    const userId = req.userId;

    const session = await PracticeHistory.findOne({
      user: userId,
      status: "started"
    })
      .sort({ createdAt: -1 })
      .populate('test', 'title type')
      .populate('section', 'title skill')
      .populate('question', 'content type')
      .select('-__v');

    if (!session) {
      return next(createError(404, "No active session found"));
    }

    // Calculate time elapsed
    const timeElapsed = Math.floor((Date.now() - session.startTime) / 1000);
    
    res.status(200).json({
      success: true,
      data: {
        ...session.toObject(),
        timeElapsed
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get session by ID
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const session = await PracticeHistory.findById(id)
      .populate('test', 'title type')
      .populate('section', 'title skill')
      .populate('question', 'content type')
      .select('-__v');

    if (!session) {
      return next(createError(404, "Practice session not found"));
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      return next(createError(403, "Access denied"));
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

// Get user's practice sessions
exports.getUserSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      skill,
      startDate,
      endDate
    } = req.query;
    const userId = req.userId;

    // Build filter
    let filter = { user: userId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (skill) filter.skill = skill;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sessions = await PracticeHistory.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('test', 'title type')
      .populate('section', 'title skill')
      .select('-answers');

    const total = await PracticeHistory.countDocuments(filter);

    // Calculate summary statistics
    const stats = await PracticeHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalCompleted: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          totalDuration: { $sum: "$duration" },
          avgScore: { $avg: "$score.band" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        statistics: stats[0] || {
          totalSessions: 0,
          totalCompleted: 0,
          totalDuration: 0,
          avgScore: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete practice session
exports.deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const session = await PracticeHistory.findById(id);
    if (!session) {
      return next(createError(404, "Practice session not found"));
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      return next(createError(403, "Access denied"));
    }

    // Don't allow deletion of completed sessions
    if (session.status === "completed") {
      return next(createError(400, "Cannot delete completed sessions"));
    }

    await PracticeHistory.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Practice session deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get session summary/progress
exports.getSessionProgress = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await PracticeHistory.findById(sessionId);
    if (!session) {
      return next(createError(404, "Practice session not found"));
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      return next(createError(403, "Access denied"));
    }

    // Calculate progress statistics
    const totalQuestions = session.answers.length;
    const answeredQuestions = session.answers.filter(a => a.answer).length;
    const correctAnswers = session.answers.filter(a => a.isCorrect).length;
    const timeSpent = session.endTime ? 
      Math.floor((session.endTime - session.startTime) / 1000) : 
      Math.floor((Date.now() - session.startTime) / 1000);

    const progress = {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
      timeSpent,
      completionRate: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
    };

    res.status(200).json({
      success: true,
      data: {
        session: session.toObject(),
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

// Bulk submit answers for real-time tracking
exports.submitAnswers = async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;
    const userId = req.userId;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return next(createError(400, "Session ID and answers array are required"));
    }

    const session = await PracticeHistory.findById(sessionId);
    if (!session) {
      return next(createError(404, "Practice session not found"));
    }

    // Verify ownership
    if (session.user.toString() !== userId.toString()) {
      return next(createError(403, "Access denied"));
    }

    // Format answers
    const formattedAnswers = answers.map(answer => ({
      questionId: answer.questionId,
      answer: answer.answer,
      isCorrect: answer.isCorrect || false,
      timeTaken: answer.timeTaken || 0
    }));

    // Add answers to session
    session.answers.push(...formattedAnswers);
    await session.save();

    res.status(200).json({
      success: true,
      message: `${answers.length} answers submitted successfully`,
      data: {
        totalAnswers: session.answers.length,
        recentAnswers: formattedAnswers
      }
    });
  } catch (error) {
    next(error);
  }
};