const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  answers: [{ questionId: String, userAnswer: mongoose.Schema.Types.Mixed }],
  score: Number,
  band: Number,
  sectionScores: {
    listening: Number,
    reading: Number,
    writing: Number,
    speaking: Number
  },
  accuracy: Number,
  timeTaken: Number,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
