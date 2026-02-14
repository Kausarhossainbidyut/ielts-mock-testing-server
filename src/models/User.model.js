import mongoose from "mongoose";

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
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
