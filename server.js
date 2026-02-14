// external import
const express =  require("express")
const dotenv = require('dotenv')
const mongoose = require("mongoose")
const cookieParser = require('cookie-parser')

// internal import 
const {errorHandler, notFoundHandler} = require('./src/middlewares/common/errorHandler')


const app = express()
dotenv.config()

// db connection
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
.then(()=>console.log("DataBase connection successfully"))
.catch((err)=>console.log(err))

// request parsers
app.use(express.json())

//parse cookies
app.use(cookieParser(process.env.COOKIE_SECRET))

// // routing setup
// app.use('/', loginRouter)
// app.use('/users', usersRouter)
// app.use('/inbox', inboxRouter)

// 404 not found handler
app.use(notFoundHandler)

// common error handler
app.use(errorHandler)


app.listen(process.env.PORT, ()=>{
    console.log(`app listening to port ${process.env.PORT}`);
    
})