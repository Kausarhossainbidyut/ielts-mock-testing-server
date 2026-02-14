const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define simple format for console
const simpleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ielts-smart-practice' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs to console with simple format
    new winston.transports.Console({
      format: simpleFormat
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log') 
    })
  ]
});

// If we're not in production, log to the console with color
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: simpleFormat,
  }));
}

// Custom logging methods for different scenarios
const customLogger = {
  // Application startup/shutdown
  startup: (message) => logger.info(`🚀 ${message}`),
  shutdown: (message) => logger.info(`🛑 ${message}`),
  
  // Database operations
  dbConnected: () => logger.info('✅ Database connection successful'),
  dbError: (error) => logger.error('❌ Database connection error', { error }),
  
  // Authentication events
  userRegistered: (userId, email) => logger.info('👤 User registered', { userId, email }),
  userLogin: (userId, email) => logger.info('🔐 User login', { userId, email }),
  userLogout: (userId) => logger.info('🔓 User logout', { userId }),
  authError: (message, userId) => logger.warn('🔒 Authentication error', { message, userId }),
  
  // API requests
  apiRequest: (method, url, userId) => logger.info('🌐 API Request', { method, url, userId }),
  apiResponse: (method, url, statusCode, responseTime) => 
    logger.info('✅ API Response', { method, url, statusCode, responseTime: `${responseTime}ms` }),
  apiError: (method, url, error, statusCode) => 
    logger.error('❌ API Error', { method, url, error, statusCode }),
  
  // Practice sessions
  sessionStarted: (sessionId, userId, type) => 
    logger.info('📝 Practice session started', { sessionId, userId, type }),
  sessionUpdated: (sessionId, userId, status) => 
    logger.info('✏️ Practice session updated', { sessionId, userId, status }),
  sessionCompleted: (sessionId, userId, score, duration) => 
    logger.info('🎉 Practice session completed', { sessionId, userId, score, duration }),
  
  // File operations
  fileUpload: (filename, userId, fileSize) => 
    logger.info('📁 File uploaded', { filename, userId, fileSize }),
  fileDownload: (filename, userId) => 
    logger.info('📥 File downloaded', { filename, userId }),
  fileError: (operation, filename, error) => 
    logger.error(`❌ File ${operation} error`, { filename, error }),
  
  // Admin operations
  adminAction: (action, userId, details) => 
    logger.info('🛡️ Admin action', { action, userId, details }),
  contentCreated: (contentType, contentId, userId) => 
    logger.info('➕ Content created', { contentType, contentId, userId }),
  contentUpdated: (contentType, contentId, userId) => 
    logger.info('✏️ Content updated', { contentType, contentId, userId }),
  contentDeleted: (contentType, contentId, userId) => 
    logger.info('❌ Content deleted', { contentType, contentId, userId }),
  
  // System events
  systemHealth: (metrics) => logger.info('📊 System health check', metrics),
  performance: (operation, duration) => 
    logger.info('⚡ Performance metric', { operation, duration: `${duration}ms` }),
  cacheHit: (key) => logger.info('💾 Cache hit', { key }),
  cacheMiss: (key) => logger.info('🔄 Cache miss', { key }),
  
  // Security events
  securityAlert: (type, details, userId) => 
    logger.warn('🚨 Security alert', { type, details, userId }),
  rateLimitExceeded: (ip, endpoint) => 
    logger.warn('🚦 Rate limit exceeded', { ip, endpoint }),
  suspiciousActivity: (activity, userId, ip) => 
    logger.warn('🕵️ Suspicious activity', { activity, userId, ip }),
  
  // Error logging with context
  error: (message, error, context = {}) => {
    logger.error(message, { 
      error: error?.message || error,
      stack: error?.stack,
      ...context 
    });
  },
  
  // Warning logging
  warn: (message, context = {}) => {
    logger.warn(message, context);
  },
  
  // Info logging
  info: (message, context = {}) => {
    logger.info(message, context);
  },
  
  // Debug logging (only in development)
  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(message, context);
    }
  }
};

module.exports = customLogger;
