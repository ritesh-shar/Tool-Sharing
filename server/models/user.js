const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },

    email:{
        type: String,
        required: true,
        index: true,
        unique: true,
        lowercase: true,
    },

    password:{
        type: String,
        required: true,
    },

},
    {
        timestamps: true,
    }
)

userSchema.pre('save', async function hashPassword(next) {
    if(!this.isModified('password')){
        return next;
    }
    try{
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password,salt);
    this.password = hash;
    next;
    }
    catch(error){
       return next(error);
    }
});

module.exports = mongoose.model('User',userSchema);
