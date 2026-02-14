import mongoose from "mongoose";

const tipSchema = new mongoose.Schema({
  title: String,
  skill: String,
  level: String,
  category: String,
  content: String,
  tags: [String],
  premium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Tip", tipSchema);
