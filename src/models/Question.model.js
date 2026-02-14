const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
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
    enum: ["multiple-choice", "short-answer", "essay", "matching", "fill-blank", "true-false"],
    required: true 
  },
  skill: { 
    type: String, 
    enum: ["listening", "reading", "writing", "speaking"],
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["easy", "medium", "hard", "exam"],
    default: "medium" 
  },
  content: { 
    type: String, 
    required: true 
  },
  options: [{
    letter: String,
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  explanation: String,
  audioUrl: String,
  imageUrl: String,
  passage: String,
  wordLimit: Number,
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
questionSchema.index({ test: 1, section: 1, questionNumber: 1 });
questionSchema.index({ skill: 1, type: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model("Question", questionSchema);