require('dotenv').config();
const app = require('./app.js');
const port = process.env.PORT || 5000;
const connectDB = require('./config/db.js');

connectDB();

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`);
})
