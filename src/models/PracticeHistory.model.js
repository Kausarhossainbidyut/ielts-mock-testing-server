import mongoose from "mongoose";

const practiceHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: String, // test, resource, tip
  refId: String,
  duration: Number,
  date: { type: Date, default: Date.now }
});

export default mongoose.model("PracticeHistory", practiceHistorySchema);
