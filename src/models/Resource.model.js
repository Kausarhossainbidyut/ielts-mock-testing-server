const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: String,
  type: { 
    type: String, 
    enum: ["book", "pdf", "audio", "video", "link", "practice-material"],
    required: true 
  },
  category: { 
    type: String, 
    enum: ["cambridge", "practice", "vocabulary", "grammar", "speaking", "writing", "listening", "reading", "general"],
    required: true 
  },
  skill: { 
    type: String, 
    enum: ["listening", "reading", "writing", "speaking", "general"],
    required: true 
  },
  level: { 
    type: String, 
    enum: ["beginner", "intermediate", "advanced", "all"],
    default: "all" 
  },
  fileUrl: String,
  externalLink: String,
  thumbnail: String,
  fileSize: Number, // in bytes
  duration: Number, // for audio/video in seconds
  author: String,
  publisher: String,
  publicationYear: Number,
  isbn: String,
  tags: [String],
  downloads: { 
    type: Number, 
    default: 0 
  },
  views: { 
    type: Number, 
    default: 0 
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isPremium: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, {
  timestamps: true
});

// Indexes for better performance
resourceSchema.index({ category: 1, skill: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ level: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ title: "text" });
resourceSchema.index({ isPremium: 1 });

module.exports = mongoose.model("Resource", resourceSchema);