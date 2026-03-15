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

userSchema.pre('save', async function hashPassword() {
    if(!this.isModified('password')){
        return ;
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password,salt);
    this.password = hash;
});

module.exports = mongoose.model('User',userSchema);
