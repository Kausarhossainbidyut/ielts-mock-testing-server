// external import
const express = require("express")

const router = express.Router()

// internal import 
const {getLogin} = require('../controller/loginController')

// login page
router.get("/",decorateHtmlResponse("Login"), getLogin)


module.exports = router