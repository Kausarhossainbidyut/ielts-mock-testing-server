const ListeningQuestion = require("../models/ListeningQuestion.model");
const Test = require("../models/Test.model");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");

// Get all listening questions with filtering
exports.getAllQuestions = async (req, res, next) => {
  try {
    const {
      test,
      section,
      type,
      difficulty,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let filter = { isActive: true };
    
    if (test) filter.test = test;
    if (section) filter.section = section;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: "i" } },
        { transcript: { $regex: search, $options: "i" } }
      ];
    }

    const questions = await ListeningQuestion.find(filter)
      .sort({ questionNumber: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('test', 'title type')
      .populate('section', 'title')
      .select('-__v');

    const total = await ListeningQuestion.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        questions,
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

// Get question by ID
exports.getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const question = await ListeningQuestion.findById(id)
      .populate('test', 'title type duration')
      .populate('section', 'title skill')
      .select('-__v');

    if (!question) {
      return next(createError(404, "Listening question not found"));
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Create new listening question (admin only)
exports.createQuestion = [
  body("test")
    .notEmpty()
    .withMessage("Test ID is required"),
  body("questionNumber")
    .isInt({ min: 1 })
    .withMessage("Question number must be a positive integer"),
  body("type")
    .isIn(["multiple-choice", "short-answer", "form-completion", "map-labeling", "sentence-completion"])
    .withMessage("Invalid listening question type"),
  body("audioUrl")
    .notEmpty()
    .withMessage("Audio URL is required"),
  body("content")
    .notEmpty()
    .withMessage("Question content is required"),
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard", "exam"])
    .withMessage("Invalid difficulty level"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      // Check if test exists
      const test = await Test.findById(req.body.test);
      if (!test) {
        return next(createError(404, "Test not found"));
      }

      // Check if question number already exists for this test
      const existingQuestion = await ListeningQuestion.findOne({
        test: req.body.test,
        questionNumber: req.body.questionNumber
      });
      
      if (existingQuestion) {
        return next(createError(409, "Question number already exists for this test"));
      }

      const questionData = {
        ...req.body,
        createdBy: req.user._id
      };

      const question = new ListeningQuestion(questionData);
      await question.save();

      // Populate for response
      await question.populate('test', 'title type');
      await question.populate('section', 'title');

      res.status(201).json({
        success: true,
        message: "Listening question created successfully",
        data: question
      });
    } catch (error) {
      next(error);
    }
  }
];

// Update listening question (admin only)
exports.updateQuestion = [
  body("questionNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Question number must be a positive integer"),
  body("type")
    .optional()
    .isIn(["multiple-choice", "short-answer", "form-completion", "map-labeling", "sentence-completion"])
    .withMessage("Invalid listening question type"),
  body("content")
    .optional()
    .notEmpty()
    .withMessage("Question content cannot be empty"),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError(400, "Validation failed", { errors: errors.array() }));
      }

      const { id } = req.params;
      
      // Check if question exists
      const existingQuestion = await ListeningQuestion.findById(id);
      if (!existingQuestion) {
        return next(createError(404, "Listening question not found"));
      }

      // If changing question number, check for conflicts
      if (req.body.questionNumber && req.body.questionNumber !== existingQuestion.questionNumber) {
        const conflict = await ListeningQuestion.findOne({
          test: existingQuestion.test,
          questionNumber: req.body.questionNumber,
          _id: { $ne: id }
        });
        
        if (conflict) {
          return next(createError(409, "Question number already exists for this test"));
        }
      }

      const updateData = { ...req.body, updatedAt: Date.now() };
      
      const question = await ListeningQuestion.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('test', 'title type')
        .populate('section', 'title')
        .select('-__v');

      res.status(200).json({
        success: true,
        message: "Listening question updated successfully",
        data: question
      });
    } catch (error) {
      next(error);
    }
  }
];

// Delete listening question (admin only)
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const question = await ListeningQuestion.findByIdAndDelete(id);
    
    if (!question) {
      return next(createError(404, "Listening question not found"));
    }

    res.status(200).json({
      success: true,
      message: "Listening question deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get questions by test
exports.getQuestionsByTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { section, type } = req.query;

    let filter = { test: testId, isActive: true };
    if (section) filter.section = section;
    if (type) filter.type = type;

    const questions = await ListeningQuestion.find(filter)
      .sort({ questionNumber: 1 })
      .populate('section', 'title skill')
      .select('-__v');

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// Get random listening questions for practice
exports.getRandomQuestions = async (req, res, next) => {
  try {
    const { type, difficulty, count = 10 } = req.query;

    let filter = { isActive: true };
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await ListeningQuestion.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(count) } },
      { $project: { __v: 0 } }
    ]);

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};