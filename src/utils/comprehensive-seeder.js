const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const Test = require("../models/Test.model");
const Section = require("../models/Section.model");
const ListeningQuestion = require("../models/ListeningQuestion.model");
const ReadingQuestion = require("../models/ReadingQuestion.model");
const WritingQuestion = require("../models/WritingQuestion.model");
const SpeakingQuestion = require("../models/SpeakingQuestion.model");
const Tip = require("../models/Tip.model");
const Resource = require("../models/Resource.model");
require("dotenv").config();

const seedDatabase = {
  // Sample users with different roles
  users: [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "AdminPassword123!",
      role: "admin",
      targetBand: 8.5,
      currentLevel: "advanced",
      verified: true,
      examDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Content Admin",
      email: "content@example.com",
      password: "ContentAdmin123!",
      role: "content_admin",
      targetBand: 8.0,
      currentLevel: "advanced",
      verified: true,
      examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    {
      name: "John Doe",
      email: "john@example.com",
      password: "StudentPassword123!",
      role: "user",
      targetBand: 7.0,
      currentLevel: "intermediate",
      verified: true,
      examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      password: "StudentPassword456!",
      role: "user",
      targetBand: 7.5,
      currentLevel: "advanced",
      verified: true,
      examDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    },
    {
      name: "Mike Johnson",
      email: "mike@example.com",
      password: "StudentPassword789!",
      role: "user",
      targetBand: 6.5,
      currentLevel: "intermediate",
      verified: false,
      examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ],

  // Sample tests
  tests: [
    {
      testId: "ACADEMIC_001",
      title: "IELTS Academic Full Mock Test 1",
      type: "full-mock",
      skills: ["listening", "reading", "writing", "speaking"],
      difficulty: "exam",
      duration: 165,
      source: "official",
      status: "published",
      popularity: 150
    },
    {
      testId: "ACADEMIC_002",
      title: "IELTS Academic Full Mock Test 2",
      type: "full-mock",
      skills: ["listening", "reading", "writing", "speaking"],
      difficulty: "exam",
      duration: 165,
      source: "official",
      status: "published",
      popularity: 120
    },
    {
      testId: "LISTENING_PRACTICE_01",
      title: "Listening Practice Test - Section 1",
      type: "practice",
      skills: ["listening"],
      difficulty: "medium",
      duration: 30,
      source: "custom",
      status: "published",
      popularity: 85
    },
    {
      testId: "READING_PRACTICE_01",
      title: "Reading Practice Test - Academic",
      type: "practice",
      skills: ["reading"],
      difficulty: "medium",
      duration: 60,
      source: "custom",
      status: "published",
      popularity: 92
    },
    {
      testId: "WRITING_TASK1_01",
      title: "Writing Task 1 - Academic Report",
      type: "practice",
      skills: ["writing"],
      difficulty: "hard",
      duration: 20,
      source: "custom",
      status: "published",
      popularity: 78
    },
    {
      testId: "DAILY_CHALLENGE_01",
      title: "Daily IELTS Challenge",
      type: "daily",
      skills: ["listening", "reading"],
      difficulty: "medium",
      duration: 45,
      source: "custom",
      status: "published",
      popularity: 200
    }
  ],

  // Sample sections
  sections: [
    // Listening sections
    {
      skill: "listening",
      title: "Section 1: Conversation",
      duration: 30,
      order: 1
    },
    {
      skill: "listening",
      title: "Section 2: Monologue",
      duration: 20,
      order: 2
    },
    {
      skill: "listening",
      title: "Section 3: Academic Discussion",
      duration: 20,
      order: 3
    },
    {
      skill: "listening",
      title: "Section 4: Academic Lecture",
      duration: 20,
      order: 4
    },
    // Reading sections
    {
      skill: "reading",
      title: "Section 1: Short Passages",
      duration: 20,
      order: 1
    },
    {
      skill: "reading",
      title: "Section 2: Medium Passages",
      duration: 20,
      order: 2
    },
    {
      skill: "reading",
      title: "Section 3: Long Passages",
      duration: 20,
      order: 3
    }
  ],

  // Sample listening questions
  listeningQuestions: [
    {
      questionNumber: 1,
      type: "multiple-choice",
      difficulty: "medium",
      audioUrl: "https://example.com/audio/listening1.mp3",
      audioDuration: 180,
      transcript: "Woman: Hello, I'm calling about the apartment advertisement. Can you tell me more about it?",
      content: "What is the woman calling about?",
      options: [
        { letter: "A", text: "Booking a hotel", isCorrect: false },
        { letter: "B", text: "Apartment information", isCorrect: true },
        { letter: "C", text: "Restaurant reservation", isCorrect: false },
        { letter: "D", text: "Flight information", isCorrect: false }
      ],
      correctAnswers: [{ position: 1, answer: "B", keywords: ["apartment", "advertisement"] }],
      explanation: "The woman clearly states she's calling about the apartment advertisement.",
      timeAllowed: 30,
      bandScore: 6.0,
      tags: ["conversation", "housing"]
    }
  ],

  // Sample reading questions
  readingQuestions: [
    {
      questionNumber: 1,
      type: "multiple-choice",
      difficulty: "medium",
      passage: "Recent studies have shown that regular exercise can significantly improve mental health. Researchers found that people who engage in physical activity for at least 30 minutes a day report lower levels of stress and anxiety. The study involved 2,000 participants across different age groups and concluded that even moderate exercise can have positive effects on mood and cognitive function.",
      passageTitle: "Exercise and Mental Health",
      passageWordCount: 75,
      content: "According to the passage, what is the minimum recommended daily exercise time?",
      options: [
        { letter: "A", text: "15 minutes", isCorrect: false },
        { letter: "B", text: "30 minutes", isCorrect: true },
        { letter: "C", text: "45 minutes", isCorrect: false },
        { letter: "D", text: "60 minutes", isCorrect: false }
      ],
      correctAnswers: [{ position: 1, answer: "B", keywords: ["30 minutes", "minimum"] }],
      explanation: "The passage clearly states 'at least 30 minutes a day'.",
      timeAllowed: 45,
      bandScore: 6.5,
      tags: ["health", "research"]
    }
  ],

  // Sample writing questions
  writingQuestions: [
    {
      questionNumber: 1,
      task: 1,
      difficulty: "exam",
      prompt: "The chart below shows the percentage of households in a small town that owned various types of pets in 2010 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      chartType: "bar-chart",
      wordLimit: 150,
      timeAllowed: 20,
      bandScore: 7.0,
      tags: ["task1", "academic", "chart"]
    },
    {
      questionNumber: 1,
      task: 2,
      difficulty: "exam",
      prompt: "Some people believe that technology has made our lives more complicated rather than simpler. To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
      essayType: "opinion",
      wordLimit: 250,
      timeAllowed: 40,
      bandScore: 7.5,
      tags: ["task2", "opinion", "technology"]
    }
  ],

  // Sample speaking questions
  speakingQuestions: [
    {
      part: 1,
      questionNumber: 1,
      difficulty: "medium",
      question: "Do you work or are you a student?",
      topic: "Work and Studies",
      timeAllowed: 60,
      bandScore: 6.0,
      tags: ["part1", "introduction"]
    },
    {
      part: 2,
      questionNumber: 1,
      difficulty: "medium",
      question: "Describe a memorable journey you have taken. You should say: where you went, when you went, who you went with, and explain why it was memorable.",
      cueCard: {
        title: "A Memorable Journey",
        points: [
          "Where you went",
          "When you went",
          "Who you went with",
          "Why it was memorable"
        ],
        preparationTime: 60,
        speakingTime: 120
      },
      timeAllowed: 180,
      bandScore: 6.5,
      tags: ["part2", "personal experience"]
    }
  ],

  // Sample tips
  tips: [
    {
      title: "Master IELTS Listening with Prediction Technique",
      category: "listening",
      difficulty: "beginner",
      content: "Always read questions before the audio starts. Predict possible answers based on question types. For example, if you see a question asking for a number, listen specifically for numerical information. This technique helps you focus on relevant information and improves your accuracy significantly.",
      keywords: ["prediction", "listening", "technique", "focus"],
      examples: [
        "For gap-fill questions, predict parts of speech",
        "For multiple choice, eliminate obviously wrong answers",
        "Listen for keywords and synonyms"
      ]
    },
    {
      title: "IELTS Reading Skimming and Scanning Strategy",
      category: "reading",
      difficulty: "intermediate",
      content: "Use the skimming technique to get the general idea by reading the first sentence of each paragraph. Then use scanning to find specific information by looking for keywords, names, dates, and numbers. This approach saves time and helps you locate answers quickly in the 60-minute time limit.",
      keywords: ["skimming", "scanning", "reading", "strategy"],
      examples: [
        "Read titles and headings first",
        "Look for capital letters and numbers",
        "Identify keywords in questions before reading"
      ]
    }
  ],

  // Sample resources
  resources: [
    {
      title: "Cambridge IELTS 17 Academic",
      description: "Official Cambridge IELTS practice tests with authentic exam papers and detailed answer keys",
      type: "book",
      category: "cambridge",
      skill: "general",
      level: "all",
      author: "Cambridge University Press",
      publisher: "Cambridge University Press",
      publicationYear: 2023,
      isbn: "9781108395751",
      isPremium: true,
      tags: ["official", "practice tests", "cambridge"]
    },
    {
      title: "IELTS Listening Practice Audio Collection",
      description: "Collection of authentic IELTS listening practice materials with various accents",
      type: "audio",
      category: "practice",
      skill: "listening",
      level: "intermediate",
      duration: 1800,
      fileUrl: "/resources/listening-practice.mp3",
      tags: ["audio", "practice", "listening"]
    }
  ],

  async seed() {
    try {
      console.log("🌱 Starting comprehensive database seeding...");
      
      // Connect to database
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
      console.log("✅ Connected to MongoDB");

      // Clear existing data
      console.log("🗑️  Clearing existing data...");
      await Promise.all([
        User.deleteMany({}),
        Test.deleteMany({}),
        Section.deleteMany({}),
        ListeningQuestion.deleteMany({}),
        ReadingQuestion.deleteMany({}),
        WritingQuestion.deleteMany({}),
        SpeakingQuestion.deleteMany({}),
        Tip.deleteMany({}),
        Resource.deleteMany({})
      ]);

      // Create users with hashed passwords
      console.log("👥 Creating users...");
      const createdUsers = await User.insertMany(
        this.users.map(user => ({
          ...user,
          password: bcrypt.hashSync(user.password, 12)
        }))
      );
      console.log(`✅ Created ${createdUsers.length} users`);

      // Create tests
      console.log("📝 Creating tests...");
      const createdTests = await Test.insertMany(this.tests);
      console.log(`✅ Created ${createdTests.length} tests`);

      // Create sections and associate with tests
      console.log("📂 Creating sections...");
      const sectionsWithTest = this.sections.map((section, index) => ({
        ...section,
        test: createdTests[0]._id // Associate with first test
      }));
      const createdSections = await Section.insertMany(sectionsWithTest);
      console.log(`✅ Created ${createdSections.length} sections`);

      // Create listening questions
      console.log("🎧 Creating listening questions...");
      const listeningQuestionsWithRefs = this.listeningQuestions.map((question, index) => ({
        ...question,
        test: createdTests[2]._id, // Listening practice test
        section: createdSections[index % 4]._id,
        createdBy: createdUsers[1]._id // Content admin
      }));
      const createdListeningQuestions = await ListeningQuestion.insertMany(listeningQuestionsWithRefs);
      console.log(`✅ Created ${createdListeningQuestions.length} listening questions`);

      // Create reading questions
      console.log("📖 Creating reading questions...");
      const readingQuestionsWithRefs = this.readingQuestions.map((question, index) => ({
        ...question,
        test: createdTests[3]._id, // Reading practice test
        section: createdSections[4 + (index % 3)]._id,
        createdBy: createdUsers[1]._id
      }));
      const createdReadingQuestions = await ReadingQuestion.insertMany(readingQuestionsWithRefs);
      console.log(`✅ Created ${createdReadingQuestions.length} reading questions`);

      // Create writing questions
      console.log("✍ Creating writing questions...");
      const writingQuestionsWithRefs = this.writingQuestions.map((question, index) => ({
        ...question,
        test: createdTests[4]._id, // Writing practice test
        section: createdSections[4]._id, // Use reading section for writing
        createdBy: createdUsers[1]._id
      }));
      const createdWritingQuestions = await WritingQuestion.insertMany(writingQuestionsWithRefs);
      console.log(`✅ Created ${createdWritingQuestions.length} writing questions`);

      // Create speaking questions
      console.log("🗣 Creating speaking questions...");
      const speakingQuestionsWithRefs = this.speakingQuestions.map((question, index) => ({
        ...question,
        test: createdTests[0]._id, // Full mock test
        section: createdSections[4]._id, // Use reading section for speaking
        createdBy: createdUsers[1]._id
      }));
      const createdSpeakingQuestions = await SpeakingQuestion.insertMany(speakingQuestionsWithRefs);
      console.log(`✅ Created ${createdSpeakingQuestions.length} speaking questions`);

      // Create tips
      console.log("💡 Creating tips...");
      const tipsWithAuthor = this.tips.map(tip => ({
        ...tip,
        createdBy: createdUsers[1]._id
      }));
      const createdTips = await Tip.insertMany(tipsWithAuthor);
      console.log(`✅ Created ${createdTips.length} tips`);

      // Create resources
      console.log("📚 Creating resources...");
      const resourcesWithAuthor = this.resources.map(resource => ({
        ...resource,
        createdBy: createdUsers[1]._id
      }));
      const createdResources = await Resource.insertMany(resourcesWithAuthor);
      console.log(`✅ Created ${createdResources.length} resources`);

      console.log("\n🎉 Database seeding completed successfully!");
      console.log("\n📋 Login Credentials:");
      console.log("Admin: admin@example.com / AdminPassword123!");
      console.log("Content Admin: content@example.com / ContentAdmin123!");
      console.log("Student 1: john@example.com / StudentPassword123!");
      console.log("Student 2: jane@example.com / StudentPassword456!");
      console.log("Student 3: mike@example.com / StudentPassword789!");

    } catch (error) {
      console.error("❌ Seeding failed:", error);
      throw error;
    } finally {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
    }
  },

  async destroy() {
    try {
      console.log("🧨 Destroying all database data...");
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
      
      await Promise.all([
        User.deleteMany({}),
        Test.deleteMany({}),
        Section.deleteMany({}),
        ListeningQuestion.deleteMany({}),
        ReadingQuestion.deleteMany({}),
        WritingQuestion.deleteMany({}),
        SpeakingQuestion.deleteMany({}),
        Tip.deleteMany({}),
        Resource.deleteMany({})
      ]);
      
      console.log("✅ All data destroyed successfully!");
    } catch (error) {
      console.error("❌ Destruction failed:", error);
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }
};

// Run seeder based on command line arguments
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === '-d' || command === '--destroy') {
    seedDatabase.destroy().catch(console.error);
  } else {
    seedDatabase.seed().catch(console.error);
  }
}

module.exports = seedDatabase;