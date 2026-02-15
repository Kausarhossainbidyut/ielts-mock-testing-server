const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { validateRegistrationData, validateLoginData } = require('../utils/validators');

// Helper function to create JWT token
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

// Register new user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, targetBand, currentLevel, examDate } = req.body;

    validateRegistrationData({ name, email, password });

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return next(createError(409, 'User already exists with this email'));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      targetBand: targetBand || 7,
      currentLevel: currentLevel || 'beginner',
      examDate: examDate || null
    });

    const savedUser = await newUser.save();

    const token = createToken({
      id: savedUser._id,
      email: savedUser.email,
      role: savedUser.role,
      verified: savedUser.verified
    });

    res.cookie('accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userResponse,
      token: `Bearer ${token}`
    });
  } catch (error) {
    next(error);
  }
};


// Login user
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateLoginData({ email, password });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(createError(401, 'Invalid email or password'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createError(401, 'Invalid email or password'));
    }

    const token = createToken({
      id: user._id,
      email: user.email,
      role: user.role,
      verified: user.verified
    });

    res.cookie('accessToken', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Ensure role is explicitly included in response
    userResponse.role = user.role;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token: `Bearer ${token}`
    });
  } catch (error) {
    next(error);
  }
};


// Get current logged in user
const getCurrentUser = async (req, res, next) => {
  try {
    // Get fresh user data from database to ensure role is up to date
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    const userData = user.toObject();
    
    // Ensure role is always included (get latest from DB)
    userData.role = user.role;
    
    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if requesting user's own data
    if (req.userId.toString() === id) {
      // Return own data
      const user = await User.findById(id).select('-password');
      if (!user) {
        return next(createError(404, 'User not found'));
      }
      return res.status(200).json({
        success: true,
        user
      });
    }
    
    // For accessing other users' data, only return public info
    const user = await User.findById(id).select('name email role verified createdAt');
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
  getUserById,
  logoutUser
};