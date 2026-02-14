// external import
const express = require("express")

const router = express.Router()

// internal import 
const { registerUser, loginUser, getCurrentUser, getUserById, logoutUser } = require('../controller/loginController')
const { authenticate } = require('../middlewares/auth')

// Registration route
router.post('/register', registerUser)

// Login route
router.post('/login', loginUser)

// Get current user (protected route)
router.get('/me', authenticate, getCurrentUser)

// Get user by ID (protected route)
router.get('/user/:id', authenticate, getUserById)

// Logout route
router.post('/logout', logoutUser)

module.exports = router