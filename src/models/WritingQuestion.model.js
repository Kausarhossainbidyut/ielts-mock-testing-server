const mongoose = require("mongoose");

const writingQuestionSchema = new mongoose.Schema({
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
  task: { 
    type: Number, 
    enum: [1, 2],
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["easy", "medium", "hard", "exam"],
    default: "exam" 
  },
  // Task prompt
  prompt: { 
    type: String, 
    required: true 
  },
  // Task 1 specific fields
  chartType: { 
    type: String, 
    enum: ["bar-chart", "line-graph", "pie-chart", "table", "map", "process-diagram", "mixed-charts"]
  },
  dataDescription: String,
  keyFeatures: [String],
  // Task 2 specific fields
  essayType: { 
    type: String, 
    enum: ["opinion", "discussion", "problem-solution", "advantages-disadvantages", "direct-question"]
  },
  topicArea: String,
  // Sample answer and guidelines
  sampleAnswer: String,
  wordLimit: { 
    type: Number, 
    required: true,
    default: 150 // Task 1: 150 words, Task 2: 250 words
  },
  suggestedStructure: [{
    paragraph: Number,
    purpose: String,
    contentPoints: [String]
  }],
  // Band descriptors
  bandDescriptors: {
    taskAchievement: String,
    coherenceCohesion: String,
    lexicalResource: String,
    grammaticalRange: String
  },
  // Evaluation criteria
  evaluationCriteria: [{
    criterion: String,
    weight: Number,
    description: String
  }],
  // Time allocation
  timeAllowed: { 
    type: Number, 
    default: 60 // 20 mins for Task 1, 40 mins for Task 2
  },
  // Scoring
  bandScore: {
    type: Number,
    min: 0,
    max: 9
  },
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
writingQuestionSchema.index({ test: 1, section: 1, questionNumber: 1 });
writingQuestionSchema.index({ task: 1 });
writingQuestionSchema.index({ difficulty: 1 });
writingQuestionSchema.index({ essayType: 1 });
writingQuestionSchema.index({ tags: 1 });

module.exports = mongoose.model("WritingQuestion", writingQuestionSchema);