import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  testId: { type: String, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["full-mock","practice","mini","daily"], required: true },
  skills: [{ type: String, enum: ["listening","reading","writing","speaking"] }],
  difficulty: { type: String, enum: ["easy","medium","hard","exam"], default: "exam" },
  duration: Number,
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
  source: { type: String, default: "custom" },
  status: { type: String, enum: ["draft","published","archived"], default: "draft" },
  popularity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Test", testSchema);
