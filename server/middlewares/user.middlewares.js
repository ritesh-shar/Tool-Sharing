const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const asyncHandler = require('../utility/asyncHandler.js');

const protect = asyncHandler(async (req,res,next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        try{
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token,process.env.JWT_SECRET)
            req.user = await User.findById(decoded.id).select('-password');
            return next();
    }
    catch(error){
        console.error('Authorization failed',error.message);
        const err = new Error("Not authorized, token failed");
        err.statusCode = 401;
        throw err;
    }
}
    if(!token){
        const error = new Error("No token provided");
        error.statusCode = 401;
        throw error;
    }

})

module.exports = protect;

