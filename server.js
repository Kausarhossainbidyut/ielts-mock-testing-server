// external import
const express =  require("express")
const dotenv = require('dotenv')
const mongoose = require("mongoose")
const cookieParser = require('cookie-parser')
const cors = require('cors')

// internal import 
const {errorHandler, notFoundHandler} = require('./src/middlewares/common/errorHandler')
const loginRouter = require('./src/routers/loginRouter')

const app = express()
dotenv.config()

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}))

// db connection
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
.then(()=>console.log("DataBase connection successfully"))
.catch((err)=>console.log(err))

// request parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//parse cookies
app.use(cookieParser(process.env.COOKIE_SECRET))

// routing setup
app.use('/api/auth', loginRouter)

// 404 not found handler
app.use(notFoundHandler)

// common error handler
app.use(errorHandler)


app.listen(process.env.PORT, ()=>{
    console.log(`app listening to port ${process.env.PORT}`);
    
})