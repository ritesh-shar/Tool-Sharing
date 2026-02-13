const User = require('../models/user.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = async (req,res,next) => {
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
        return res.status(401).json({message:"Authorization failed"});
    }
}
    if(!token){
        return res.status(401).json({message:"Authorization failed"});
    }

}

module.exports = protect;

