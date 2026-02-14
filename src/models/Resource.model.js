import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ["book","pdf","audio","video","link"] },
  format: [String],
  skills: [String],
  level: String,
  source: String,
  free: { type: Boolean, default: true },
  url: String,
  tags: [String],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Resource", resourceSchema);
