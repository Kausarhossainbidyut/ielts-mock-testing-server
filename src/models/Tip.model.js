const mongoose = require("mongoose");

const tipSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  category: { 
    type: String, 
    enum: ["listening", "reading", "writing", "speaking"],
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner" 
  },
  content: { 
    type: String, 
    required: true 
  },
  keywords: [String],
  examples: [String],
  template: String,
  views: { 
    type: Number, 
    default: 0 
  },
  averageRating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
tipSchema.index({ category: 1, difficulty: 1 });
tipSchema.index({ keywords: 1 });
tipSchema.index({ views: -1 });
tipSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Tip", tipSchema);
