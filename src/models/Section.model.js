import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  skill: { type: String, enum: ["listening","reading","writing","speaking"] },
  title: String,
  duration: Number,
  order: Number
});


export default mongoose.model("Section", sectionSchema);