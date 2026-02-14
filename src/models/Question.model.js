import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  skill: { type: String, enum: ["listening","reading","writing","speaking"] },
  type: { 
    type: String, 
    enum: ["mcq","fill_blank","true_false","matching","essay","short_answer"] 
  },
  text: String,
  options: [String],
  answer: mongoose.Schema.Types.Mixed,
  explanation: String,
  difficulty: { type: String, enum: ["easy","medium","hard"] },
  tags: [String],
  audioUrl: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Question", questionSchema);
