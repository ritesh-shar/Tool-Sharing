const express = require('express');
require('dotenv').config();
const cors = require("cors");
const connectDB = require('./config/db.js');
const userRoutes = require('./routers/user.routes.js');
const toolRoutes = require('./routers/tools.routes.js');
const rentalRoutes = require('./routers/rental.routes.js');

const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

connectDB();

app.get('/',(req,res) =>{
    res.send('Hello');
})

app.use('/api/users',userRoutes)
app.use('/api/tools',toolRoutes)
app.use('/api/rentals',rentalRoutes)

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
})
