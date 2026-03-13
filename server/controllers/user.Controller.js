const User = require('../models/user.js');
const generateToken = require('../utility/generateToken.js');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utility/asyncHandler.js');
const {registerZodSchema, loginZodSchema} = require('../ValidationSchemas/userValidator.js');

const registerUser = asyncHandler(async (req,res) => {
    const data = registerZodSchema.parse(req.body);
    const userExists = await User.findOne({email : data.email});
    if(userExists){
        const error = new Error("Email already exists");
        error.statusCode = 400;
        throw error;
    }
    const newUser = await User.create({
        name : data.name,
        email : data.email,
        password: data.password,
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
        id: newUser._id,
        token,
    });

})

const loginUser = asyncHandler(async (req,res) =>{
    const data = loginZodSchema.parse(req.body);
    const emailExists = await User.findOne({email : data.email});
    if(!emailExists){
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }
    const samePassword = await bcrypt.compare(data.password,emailExists.password);
    if(!samePassword){
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
    }
    const token = generateToken(emailExists._id);
    return res.status(200).json({
        name : emailExists.name,
        email : emailExists.email,
        token,
    })
})

const getMe = asyncHandler(async (req,res) =>{
    return res.status(200).json(req.user);
})

module.exports = {registerUser,loginUser,getMe};
