const rateLimit = require('express-rate-limit');
const createError = require('http-errors');
const logger = require('../utils/logger');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logger.rateLimitExceeded(req.ip, req.originalUrl);
    next(createError(429, "Too many requests from this IP, please try again later."));
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logger.securityAlert('auth_rate_limit', {
      ip: req.ip,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    next(createError(429, "Too many authentication attempts. Please try again later."));
  }
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: "Upload limit exceeded. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logger.rateLimitExceeded(req.ip, req.originalUrl);
    next(createError(429, "Upload limit exceeded. Please try again later."));
  }
});

// Admin panel rate limiting (stricter)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: "Admin access rate limit exceeded."
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logger.securityAlert('admin_rate_limit', {
      ip: req.ip,
      endpoint: req.originalUrl,
      userId: req.userId
    });
    next(createError(429, "Admin access rate limit exceeded."));
  }
});

// API endpoint specific rate limiting
const apiSpecificLimiters = {
  // Test taking (more generous)
  testTaking: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 test-related requests per hour
    message: {
      success: false,
      message: "Test session rate limit exceeded."
    }
  }),
  
  // Content creation (moderate)
  contentCreation: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 content operations per hour
    message: {
      success: false,
      message: "Content creation rate limit exceeded."
    }
  })
};

// Security middleware
const securityMiddleware = {
  // Suspicious activity detection
  detectSuspiciousActivity: (req, res, next) => {
    const suspiciousPatterns = [
      /(\.\.\/)+/, // Directory traversal
      /(<script|javascript:)/i, // XSS attempts
      /(union|select|insert|delete|drop|create|alter|exec|execute)/i, // SQL injection
      /(%3c|<).*script.*(>|%3e)/i // Encoded XSS
    ];

    const requestData = `${req.url} ${JSON.stringify(req.body)} ${req.get('User-Agent') || ''}`;
    
    for (let pattern of suspiciousPatterns) {
      if (pattern.test(requestData)) {
        logger.securityAlert('suspicious_pattern_detected', {
          pattern: pattern.toString(),
          userId: req.userId,
          ip: req.ip,
          url: req.url
        });
        
        // Don't immediately block, but log and monitor
        return next(createError(400, "Invalid request data"));
      }
    }

    next();
  },

  // IP-based access control
  ipWhitelist: (allowedIps = []) => {
    return (req, res, next) => {
      const clientIp = req.ip;
      if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
        logger.securityAlert('ip_not_whitelisted', {
          ip: clientIp,
          endpoint: req.originalUrl
        });
        return next(createError(403, "Access denied"));
      }
      next();
    };
  },

  // User agent validation
  validateUserAgent: (req, res, next) => {
    const userAgent = req.get('User-Agent');
    
    // Block requests without user agent (likely bots)
    if (!userAgent) {
      logger.securityAlert('missing_user_agent', {
        ip: req.ip,
        endpoint: req.originalUrl
      });
      return next(createError(403, "User agent required"));
    }

    // Block known malicious user agents
    const maliciousUserAgents = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i
    ];

    for (let pattern of maliciousUserAgents) {
      if (pattern.test(userAgent)) {
        logger.securityAlert('malicious_user_agent', {
          userAgent,
          ip: req.ip
        });
        return next(createError(403, "Access denied"));
      }
    }

    next();
  },

  // Request size limiting
  limitRequestSize: (maxSize = '10mb') => {
    return (req, res, next) => {
      // Check content-length header
      const contentLength = req.get('Content-Length');
      if (contentLength && parseInt(contentLength) > maxSize) {
        logger.securityAlert('request_too_large', {
          contentLength,
          maxSize,
          userId: req.userId,
          ip: req.ip
        });
        return next(createError(413, "Request entity too large"));
      }
      next();
    };
  },

  // Prevent enumeration attacks
  preventEnumeration: (req, res, next) => {
    // Track failed attempts by IP
    if (!req.session) {
      req.session = {};
    }
    
    if (!req.session.failedAttempts) {
      req.session.failedAttempts = {};
    }

    const ip = req.ip;
    const now = Date.now();
    
    // Clean up old attempts (older than 1 hour)
    Object.keys(req.session.failedAttempts).forEach(timestamp => {
      if (now - parseInt(timestamp) > 3600000) {
        delete req.session.failedAttempts[timestamp];
      }
    });

    // Check if this IP has too many recent failed attempts
    const recentAttempts = Object.keys(req.session.failedAttempts)
      .filter(timestamp => now - parseInt(timestamp) < 900000) // 15 minutes
      .length;

    if (recentAttempts > 10) {
      logger.securityAlert('enumeration_attack_detected', {
        ip,
        recentAttempts,
        endpoint: req.originalUrl
      });
      return next(createError(429, "Too many failed attempts. Please try again later."));
    }

    // Track this attempt if it fails
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        req.session.failedAttempts[now] = {
          endpoint: req.originalUrl,
          ip: ip
        };
      }
    });

    next();
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  adminLimiter,
  apiSpecificLimiters,
  securityMiddleware
};