const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { validateRegistrationData, validateLoginData } = require('../utils/validators');

// Helper function to create JWT token
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register new user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, targetBand, currentLevel, examDate } = req.body;
    
    // Validate input data
    validateRegistrationData({ name, email, password });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createError(409, 'User already exists with this email'));
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      targetBand: targetBand || 7,
      currentLevel: currentLevel || 'beginner',
      examDate: examDate || undefined
    });
    
    const savedUser = await newUser.save();
    
    // Create JWT token
    const token = createToken({ _id: savedUser._id, email: savedUser.email });
    
    // Set cookie with token
    res.cookie('accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Send response without password
    const userResponse = { ...savedUser.toObject() };
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input data
    validateLoginData({ email, password });
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, 'Invalid email or password'));
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createError(400, 'Invalid email or password'));
    }
    
    // Create JWT token
    const token = createToken({ _id: user._id, email: user.email });
    
    // Set cookie with token
    res.cookie('accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Send response without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Get current logged in user
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logoutUser = (req, res) => {
  res.clearCookie('accessToken');
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser
};