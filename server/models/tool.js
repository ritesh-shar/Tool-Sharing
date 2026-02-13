const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema({

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    toolName:{
        type:String,
        required: true
    },

    description:{
        type:String,
        required: true,
    },

    location:{
        type:String,
        required: true,
    },

    images:{
        type: String,
        required: true,
    },


    pricePerHour:{
        type: Number,
        required: true,
    },

    isAvailable:{
        type: Boolean,
        default: true,
    },

    renter:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

},

    {
        timestamps:true,
    },

)

module.exports =  mongoose.model('Tool',toolSchema);
