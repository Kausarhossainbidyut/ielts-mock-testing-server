const mongoose = require("mongoose");

const speakingQuestionSchema = new mongoose.Schema({
  test: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Test", 
    required: true 
  },
  section: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Section" 
  },
  part: { 
    type: Number, 
    enum: [1, 2, 3],
    required: true 
  },
  questionNumber: { 
    type: Number, 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["easy", "medium", "hard", "exam"],
    default: "medium" 
  },
  // Question content
  question: { 
    type: String, 
    required: true 
  },
  // Part-specific fields
  topic: String, // For Part 1
  cueCard: { // For Part 2
    title: String,
    points: [String],
    preparationTime: { type: Number, default: 60 }, // seconds
    speakingTime: { type: Number, default: 120 } // seconds
  },
  discussionTopics: [String], // For Part 3
  // Audio/Visual aids
  audioUrl: String, // Sample response or instruction
  imageUrl: String,
  // Response guidelines
  expectedResponse: {
    minLength: Number, // in seconds
    maxLength: Number, // in seconds
    keyPoints: [String]
  },
  // Scoring rubric
  scoringCriteria: [{
    category: { 
      type: String, 
      enum: ["fluency", "vocabulary", "grammar", "pronunciation", "coherence"]
    },
    bandScores: {
      "9": String,
      "8": String,
      "7": String,
      "6": String,
      "5": String
    }
  }],
  // Sample answer
  sampleAnswer: String,
  // Vocabulary and phrases
  usefulVocabulary: [String],
  grammarPoints: [String],
  // Time allocation
  timeAllowed: Number, // in seconds
  // Band score
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
speakingQuestionSchema.index({ test: 1, section: 1, questionNumber: 1 });
speakingQuestionSchema.index({ part: 1 });
speakingQuestionSchema.index({ difficulty: 1 });
speakingQuestionSchema.index({ topic: 1 });
speakingQuestionSchema.index({ tags: 1 });

module.exports = mongoose.model("SpeakingQuestion", speakingQuestionSchema);