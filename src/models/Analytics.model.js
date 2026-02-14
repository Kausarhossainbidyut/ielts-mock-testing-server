const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  action: { 
    type: String, 
    required: true,
    enum: [
      "login", "logout", "test_started", "test_completed", 
      "question_answered", "resource_downloaded", "tip_viewed",
      "profile_updated", "payment_made", "feedback_submitted"
    ]
  },
  targetType: { 
    type: String, 
    enum: ["test", "question", "resource", "tip", "user", "payment"]
  },
  targetId: mongoose.Schema.Types.ObjectId,
  metadata: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    region: String
  },
  sessionId: String,
  referrer: String,
  url: String
}, {
  timestamps: true
});

// Indexes for analytics queries
analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ action: 1, createdAt: -1 });
analyticsSchema.index({ targetType: 1, targetId: 1 });
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Analytics", analyticsSchema);