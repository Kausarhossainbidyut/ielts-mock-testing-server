import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  avgBand: Number,
  strongSkill: String,
  weakSkill: String,
  accuracyTrend: [Number],
  practiceFrequency: Number,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Analytics", analyticsSchema);
