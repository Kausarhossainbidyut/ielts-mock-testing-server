const validator = require('validator');
const createError = require('http-errors');

// Email validation
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

// Password validation
const isValidPassword = (password) => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  return passwordRegex.test(password);
};

// Validate registration data
const validateRegistrationData = (data) => {
  const { name, email, password } = data;
  
  // Validate name
  if (!name || name.trim().length < 2) {
    throw createError(400, 'Name must be at least 2 characters long');
  }
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    throw createError(400, 'Please provide a valid email address');
  }
  
  // Validate password
  if (!password || !isValidPassword(password)) {
    throw createError(
      400, 
      'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?])'
    );
  }
  
  return true;
};

// Validate login data
const validateLoginData = (data) => {
  const { email, password } = data;
  
  if (!email || !isValidEmail(email)) {
    throw createError(400, 'Please provide a valid email address');
  }
  
  if (!password || password.length < 1) {
    throw createError(400, 'Password is required');
  }
  
  return true;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  validateRegistrationData,
  validateLoginData
};