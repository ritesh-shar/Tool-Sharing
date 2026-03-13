const express = require('express');
require('dotenv').config();
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db.js');
const userRoutes = require('./routers/user.routes.js');
const toolRoutes = require('./routers/tools.routes.js');
const rentalRoutes = require('./routers/rental.routes.js');
const errorHandler = require('./middlewares/errorHandler.js');

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: {success: false, message: "Too many requests from this IP, please try again later."}
});

app.use(helmet());
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));


const port = process.env.PORT || 5000;

connectDB();

app.get('/',(req,res) =>{
    res.send('Hello');
})

app.use('/api/users/register', limiter);
app.use('/api/users/login', limiter);

app.use('/api/users',userRoutes)
app.use('/api/tools',toolRoutes)
app.use('/api/rentals',rentalRoutes)
app.use(errorHandler)

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
})
