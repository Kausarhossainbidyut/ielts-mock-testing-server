const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const authenticate = (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.accessToken;
    
    if (!token) {
      return next(createError(401, 'Access denied. No token provided.'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded._id;
    req.userEmail = decoded.email;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired.'));
    }
    next(error);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, `Role '${req.user.role}' is not allowed to access this resource`)
      );
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};