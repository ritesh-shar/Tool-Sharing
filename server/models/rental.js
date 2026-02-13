const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({

    renter:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    tool:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tool',
        required: true,
    },

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    pricePerHour:{
        type: Number,
        required: true
    },

    totalCost:{
        type:Number,
        default:0,
    },

    rentTimeStart:{
        type: Date,
        default: Date.now,
    },

    rentTimeEnd:{
        type:Date,
        required: false,
    },

    status:{
        type: String,
        enum: ['Active','Completed','Cancelled'],
        default: 'Active'
    }

},

    {
        timestamps: true,
    }

)

module.exports = mongoose.model('Rental',rentalSchema);
