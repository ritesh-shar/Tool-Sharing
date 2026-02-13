const User = require('../models/user.js');
const generateToken = require('../utility/generateToken.js');
const bcrypt = require('bcryptjs');

const registerUser = async (req,res) => {
    const {name,email,password} = req.body;
    const userExists = await User.findOne({email});
    if(userExists){
        return res.status(403).json({message:"User already exists"});
    }
    const newUser = await User.create({
        name : name,
        email : email,
        password: password,
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
        name: newUser.name,
        email: newUser.email,
        id: newUser._id,
        token,
    });

}

const loginUser = async (req,res) =>{
    const {email,password} = req.body;
    const emailExists = await User.findOne({email});
    if(!emailExists){
        return res.status(404).json({message:"Email not found"});
    }
    const samePassword = await bcrypt.compare(password,emailExists.password);
    if(!samePassword){
        return res.status(401).json({message:"Invalid credentials"});
    }
    const token = generateToken(emailExists._id);
    return res.status(200).json({
        name : emailExists.name,
        email : emailExists.email,
        token,
    })
}

const getMe = async (req,res) =>{
    return res.status(201).json(req.user);
}

module.exports = {registerUser,loginUser,getMe};
