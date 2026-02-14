// external import
const express = require("express")

const router = express.Router()

// internal import 
const { registerUser, loginUser, getCurrentUser, logoutUser } = require('../controller/loginController')
const { authenticate } = require('../middlewares/auth')

// Registration route
router.post('/register', registerUser)

// Login route
router.post('/login', loginUser)

// Get current user (protected route)
router.get('/me', authenticate, getCurrentUser)

// Logout route
router.post('/logout', logoutUser)

module.exports = router