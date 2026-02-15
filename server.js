// external imports
const express = require("express");
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// internal imports
const logger = require('./src/utils/logger');
const { generalLimiter, securityMiddleware } = require('./src/middlewares/security');
const { errorHandler, notFoundHandler } = require('./src/middlewares/common/errorHandler');
const loginRouter = require('./src/routers/loginRouter');
const userRouter = require('./src/routers/userRouter');
const tipRouter = require('./src/routers/tipRouter');
const testRouter = require('./src/routers/testRouter');
const questionRouter = require('./src/routers/questionRouter');
const listeningQuestionRouter = require('./src/routers/listeningQuestionRouter');
const readingQuestionRouter = require('./src/routers/readingQuestionRouter');
const writingQuestionRouter = require('./src/routers/writingQuestionRouter');
const speakingQuestionRouter = require('./src/routers/speakingQuestionRouter');
const resourceRouter = require('./src/routers/resourceRouter');
const resultRouter = require('./src/routers/resultRouter');
const adminRouter = require('./src/routers/adminRouter');
const practiceSessionRouter = require('./src/routers/practiceSessionRouter');

// Initialize express app
const app = express();
dotenv.config();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Security middleware
app.use(securityMiddleware.detectSuspiciousActivity);
app.use(securityMiddleware.validateUserAgent);
app.use(securityMiddleware.limitRequestSize('10mb'));
app.use(securityMiddleware.preventEnumeration);

// Rate limiting
app.use(generalLimiter);

// Logging
app.use(morgan('combined'));

// Log incoming requests
app.use((req, res, next) => {
  logger.apiRequest(req.method, req.url, req.userId);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiResponse(req.method, req.url, res.statusCode, duration);
  });
  
  next();
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://localhost:5000',
      ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [])
    ];
    const isAllowed = allowedOrigins.includes(origin);
    callback(null, isAllowed);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Database connection
mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
})
.then(() => {
  logger.dbConnected();
  logger.startup("Database connection successful");
})
.catch((err) => {
  logger.dbError(err);
  logger.error("Database connection failed", err);
});

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// API Routes
app.use('/api/auth', loginRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tips', tipRouter);
app.use('/api/v1/tests', testRouter);
// Skill-specific question routes first (more specific)
app.use('/api/v1/questions/listening', listeningQuestionRouter);
app.use('/api/v1/questions/reading', readingQuestionRouter);
app.use('/api/v1/questions/writing', writingQuestionRouter);
app.use('/api/v1/questions/speaking', speakingQuestionRouter);
// General questions route last (less specific)
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/resources', resourceRouter);
app.use('/api/v1/results', resultRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/practice', practiceSessionRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.startup(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.shutdown('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.shutdown('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed.');
    process.exit(0);
  });
});