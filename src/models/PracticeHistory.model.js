const mongoose = require("mongoose");

const practiceHistorySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  test: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Test" 
  },
  section: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Section" 
  },
  question: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Question" 
  },
  type: { 
    type: String, 
    enum: ["full-test", "section", "question", "practice"],
    required: true 
  },
  skill: { 
    type: String, 
    enum: ["listening", "reading", "writing", "speaking"]
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: Date,
  duration: Number, // in seconds
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    answer: String,
    isCorrect: Boolean,
    timeTaken: Number // in seconds
  }],
  score: {
    raw: Number,
    band: Number,
    percentage: Number
  },
  feedback: String,
  status: { 
    type: String, 
    enum: ["started", "completed", "paused", "abandoned"],
    default: "started" 
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    location: String
  },
  submittedAnswers: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for performance
practiceHistorySchema.index({ user: 1, createdAt: -1 });
practiceHistorySchema.index({ test: 1 });
practiceHistorySchema.index({ skill: 1 });
practiceHistorySchema.index({ status: 1 });
practiceHistorySchema.index({ createdAt: -1 });

// Virtual for calculating time spent
practiceHistorySchema.virtual('timeSpent').get(function() {
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.duration || 0;
});

module.exports = mongoose.model("PracticeHistory", practiceHistorySchema);