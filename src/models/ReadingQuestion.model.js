const mongoose = require("mongoose");

const readingQuestionSchema = new mongoose.Schema({
  test: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Test", 
    required: true 
  },
  section: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Section" 
  },
  questionNumber: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["multiple-choice", "true-false-not-given", "yes-no-not-given", "matching-headings", "matching-information", "matching-sentence-endings", "sentence-completion", "summary-completion", "table-completion", "flow-chart-completion", "diagram-label-completion", "short-answer"],
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["easy", "medium", "hard", "exam"],
    default: "medium" 
  },
  // Reading passage
  passage: { 
    type: String, 
    required: true 
  },
  passageTitle: String,
  passageWordCount: Number,
  // Question content
  content: { 
    type: String, 
    required: true 
  },
  // Options for multiple choice and matching
  options: [{
    letter: String,
    text: String,
    isCorrect: Boolean
  }],
  // Answers
  correctAnswers: [{
    position: Number,
    answer: String,
    keywords: [String],
    paraphrases: [String] // Alternative correct answers
  }],
  // Matching specific fields
  headings: [String], // For matching headings
  statements: [String], // For matching information
  // Completion specific fields
  gaps: [{
    position: Number,
    wordLimit: Number,
    answer: String
  }],
  explanation: String,
  // Visual elements
  passageImageUrl: String,
  questionImageUrl: String,
  // Scoring
  bandScore: {
    type: Number,
    min: 0,
    max: 9
  },
  timeAllowed: Number, // in seconds
  tags: [String],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
readingQuestionSchema.index({ test: 1, section: 1, questionNumber: 1 });
readingQuestionSchema.index({ difficulty: 1 });
readingQuestionSchema.index({ type: 1 });
readingQuestionSchema.index({ tags: 1 });
readingQuestionSchema.index({ passageWordCount: 1 });

module.exports = mongoose.model("ReadingQuestion", readingQuestionSchema);