const rental = require('../models/rental.js');
const tool = require('../models/tool.js');
const asyncHandler = require('../utility/asyncHandler.js');
const mongoose = require('mongoose');

const startRental = asyncHandler(async (req,res) => {
    const toolId = req.params.id;
    const renterId = req.user.id;
    const MAX_RETRIES = 3;
    for(let attempt = 1; attempt <= MAX_RETRIES; attempt++){
    const session = await mongoose.startSession();
    try{
        session.startTransaction();
        const toolToRent = await tool.findOneAndUpdate({
            _id: toolId,
            isAvailable: true,
            owner: {$ne: renterId},},
            {isAvailable: false, renter: renterId},
            {returnDocument: "after", session: session});

        if(!toolToRent){
            const existingTool = await tool.findById(toolId).session(session);
            if(!existingTool){
                const error = new Error("Tool not found");
                error.statusCode = 404;
                throw error;
            }
            if(existingTool.owner.toString() === renterId){
            const error = new Error("Cannot rent what you own");
            error.statusCode = 403;
            throw error;
        }

        const error = new Error("Tool is not available for rent");
        error.statusCode = 400;
        throw error;
}
    const newRental = await rental.create([{
        renter: renterId,
        owner: toolToRent.owner,
        tool: toolToRent._id,
        pricePerHour: toolToRent.pricePerHour,
        status:'Active'
     }], {session: session});


     await session.commitTransaction();

    return res.status(201).json({
        rentalid: newRental[0]._id,
        toolId: toolToRent._id,
        starttime: newRental[0].rentTimeStart,
    })
    }
    catch(error){
        await session.abortTransaction();
        if (
                (error.hasErrorLabel &&
                 error.hasErrorLabel("TransientTransactionError")) &&
                attempt < MAX_RETRIES
            ) {
                continue;
            }
        throw error;
    }
    finally{
        await session.endSession();
    }
}
});

const endRental = asyncHandler(async (req,res) =>{
    const session = await mongoose.startSession();
    session.startTransaction();

    try{
        const rentalid = req.params.id;
        if (!mongoose.isValidObjectId(rentalid)) {
    const error = new Error("Invalid rental ID");
    error.statusCode = 400;
    throw error;
}
        const myRental = await rental.findById(rentalid).session(session);
        if(!myRental){
            const error = new Error("Rental not found");
            error.statusCode = 404;
            throw error;
        }
        if(myRental.status != 'Active'){
            const error = new Error("Tool not in use");
            error.statusCode = 400;
            throw error;
        }
        if(myRental.renter.toString() != req.user.id){
            const error = new Error("Not authorised to end the rental");
            error.statusCode = 403;
            throw error;
        }

        const findTool = myRental.tool;
        const myTool = await tool.findById(findTool).session(session);
        if(!myTool || !myTool.renter || myTool.renter.toString() != req.user.id){
            const error = new Error("Not renting tool");
            error.statusCode = 400;
            throw error;
        }

        myRental.status = 'Completed';
        myRental.rentTimeEnd = Date.now();

        const durationMS = myRental.rentTimeEnd - myRental.rentTimeStart;
        const hours = Math.max(1,Math.ceil((durationMS/(1000*60*60))));
        myRental.totalCost = myRental.pricePerHour*hours;

        myTool.isAvailable = true;
        myTool.renter = null;
    
        await myTool.save({session: session});
        await myRental.save({session: session});

        await session.commitTransaction();

        return res.status(200).json({
            message:"Rental Ended",
            totalCost: myRental.totalCost
        });

    }
    catch(error){
        await session.abortTransaction();
        throw error;
    }

    finally{
        await session.endSession();
    }

})

const getMyRentals = asyncHandler(async (req,res) => {
    const filter = {renter: req.user.id};
    if(req.query.status){
        filter.status = req.query.status;
    }
    const page = Math.max(1,parseInt(req.query.page) || 1);
    const limit = Math.max(1,parseInt(req.query.limit) || 10);
    const skip = (page-1)*limit;
    const [total, myRentals] = await Promise.all([
        rental.countDocuments(filter),
        rental.find(filter).populate('tool','toolName pricePerHour').populate('owner','name').skip(skip).limit(limit).sort({createdAt: -1})
    ]);
        const totalPages = Math.max(1,Math.ceil(total/limit));
        res.status(200).json({
            success: true,
            total,
            totalPages,
            currentPage: page,
            rentals: myRentals
        })
});

module.exports = {startRental,endRental,getMyRentals};
