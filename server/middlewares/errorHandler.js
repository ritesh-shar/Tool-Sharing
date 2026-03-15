const {z} = require('zod');
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message;  
    if(err.name === 'ZodError' || err.errors){
        statusCode = 400;
        message = err.errors?.map(e => e.message).join(", ");
    }
    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    }); 
}

module.exports = errorHandler;
