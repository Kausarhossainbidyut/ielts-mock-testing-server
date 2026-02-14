const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["user","admin","super_admin","content_admin"], 
    default: "user" 
  },
  verified: { type: Boolean, default: false },
  targetBand: { type: Number, default: 7 },
  currentLevel: { type: String, enum: ["beginner","intermediate","advanced"], default: "beginner" },
  examDate: { type: Date },
  savedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
  practiceHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "PracticeHistory" }],
  preferences: {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: true }
  },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastPracticeDate: { type: Date }
  },
  achievements: [{
    name: String,
    earnedAt: { type: Date, default: Date.now },
    badge: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
