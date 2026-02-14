const Question = require("../models/Question.model");
const Test = require("../models/Test.model");
const Section = require("../models/Section.model");
const { body, validationResult } = require("express-validator");
const createError = require("http-errors");

// Get all questions with filtering
exports.getAllQuestions = async (req, res, next) => {
  try {
    const {
      test,
      section,
      skill,
      type,
      difficulty,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let filter = { isActive: true };
    
    if (test) filter.test = test;
    if (section) filter.section = section;
    if (skill) filter.skill = skill;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { content: { $regex: search, $options: "i" } },
        { passage: { $regex: search, $options: "i" } }
      ];
    }

    const questions = await Question.find(filter)
      .sort({ questionNumber: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('test', 'title type')
      .populate({ path: 'section', select: 'title', options: { strictPopulate: false } })
      .select('-__v');

    const total = await Question.countDocuments(filter);

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
    
    const question = await Question.findById(id)
      .populate('test', 'title type duration')
      .populate({ path: 'section', select: 'title skill', options: { strictPopulate: false } })
      .select('-__v');

    if (!question) {
      return next(createError(404, "Question not found"));
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// Create new question (admin only)
exports.createQuestion = [
  body("test")
    .notEmpty()
    .withMessage("Test ID is required"),
  body("questionNumber")
    .isInt({ min: 1 })
    .withMessage("Question number must be a positive integer"),
  body("type")
    .isIn(["multiple-choice", "short-answer", "essay", "matching", "fill-blank", "true-false"])
    .withMessage("Invalid question type"),
  body("skill")
    .isIn(["listening", "reading", "writing", "speaking"])
    .withMessage("Invalid skill"),
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
      const existingQuestion = await Question.findOne({
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

      const question = new Question(questionData);
      await question.save();

      // Populate for response
      await question.populate('test', 'title type');
      await question.populate('section', 'title');

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: question
      });
    } catch (error) {
      next(error);
    }
  }
];

// Update question (admin only)
exports.updateQuestion = [
  body("questionNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Question number must be a positive integer"),
  body("type")
    .optional()
    .isIn(["multiple-choice", "short-answer", "essay", "matching", "fill-blank", "true-false"])
    .withMessage("Invalid question type"),
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
      const existingQuestion = await Question.findById(id);
      if (!existingQuestion) {
        return next(createError(404, "Question not found"));
      }

      // If changing question number, check for conflicts
      if (req.body.questionNumber && req.body.questionNumber !== existingQuestion.questionNumber) {
        const conflict = await Question.findOne({
          test: existingQuestion.test,
          questionNumber: req.body.questionNumber,
          _id: { $ne: id }
        });
        
        if (conflict) {
          return next(createError(409, "Question number already exists for this test"));
        }
      }

      const updateData = { ...req.body, updatedAt: Date.now() };
      
      const question = await Question.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('test', 'title type')
        .populate('section', 'title')
        .select('-__v');

      res.status(200).json({
        success: true,
        message: "Question updated successfully",
        data: question
      });
    } catch (error) {
      next(error);
    }
  }
];

// Delete question (admin only)
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findByIdAndDelete(id);
    
    if (!question) {
      return next(createError(404, "Question not found"));
    }

    res.status(200).json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get questions by test
exports.getQuestionsByTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { section, skill, type } = req.query;

    let filter = { test: testId, isActive: true };
    if (section) filter.section = section;
    if (skill) filter.skill = skill;
    if (type) filter.type = type;

    const questions = await Question.find(filter)
      .sort({ questionNumber: 1 })
      .populate({ path: 'section', select: 'title skill', options: { strictPopulate: false } })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// Get random questions for practice
exports.getRandomQuestions = async (req, res, next) => {
  try {
    const { skill, type, difficulty, count = 10 } = req.query;

    let filter = { isActive: true };
    if (skill) filter.skill = skill;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.aggregate([
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