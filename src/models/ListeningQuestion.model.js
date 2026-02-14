const mongoose = require("mongoose");

const listeningQuestionSchema = new mongoose.Schema({
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
    enum: ["multiple-choice", "short-answer", "form-completion", "map-labeling", "sentence-completion"],
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["easy", "medium", "hard", "exam"],
    default: "medium" 
  },
  // Audio specific fields
  audioUrl: { 
    type: String, 
    required: true 
  },
  audioDuration: Number, // in seconds
  transcript: String, // For reference
  content: { 
    type: String, 
    required: true 
  },
  // Question options for multiple choice
  options: [{
    letter: String,
    text: String,
    isCorrect: Boolean
  }],
  // Answers - can be multiple for different question types
  correctAnswers: [{
    position: Number,
    answer: String,
    keywords: [String] // For keyword matching
  }],
  explanation: String,
  // Timing
  timeAllowed: Number, // in seconds
  audioStartTime: Number, // When question appears in audio
  audioEndTime: Number, // When question ends in audio
  // Visual aids
  imageUrl: String,
  diagramUrl: String,
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
listeningQuestionSchema.index({ test: 1, section: 1, questionNumber: 1 });
listeningQuestionSchema.index({ difficulty: 1 });
listeningQuestionSchema.index({ type: 1 });
listeningQuestionSchema.index({ tags: 1 });
listeningQuestionSchema.index({ audioUrl: 1 });

module.exports = mongoose.model("ListeningQuestion", listeningQuestionSchema);