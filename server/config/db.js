const mongoose = require('mongoose');
require('dotenv').config();
const URI = process.env.MONGO_URI;
const connectDB = async () => {
    try{
        const conn = await mongoose.connect(URI);
        if(conn){
            console.log("Connected to",conn.connection.host)
        }
    }
    catch(error){
        console.log("error",error.message)
        process.exit(1);
    }
}

module.exports = connectDB;
