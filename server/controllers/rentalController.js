const rental = require('../models/rental.js');
const tool = require('../models/tool.js');

const startRental = async (req,res) => {
    const session = await rental.startSession();
    session.startTransaction();
    try{
    const toolId = req.params.id;
    const renterId = req.user.id;
    
    const toolToRent = await tool.findById(toolId).session(session);

    if(!toolToRent){
        throw {status: 404 ,message:"Tool not found"};
    }
    if(toolToRent.owner.toString() === renterId){
        throw {status : 403 , message:"Cannot rent what you own"};
    }

    if(!toolToRent.isAvailable){
        throw {status: 400, message:"Tool already in use"};
    }

    toolToRent.isAvailable = false;
    toolToRent.renter =  renterId;
    await toolToRent.save({session: session});

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
        return res.status(error.status || 500).json({message:"Error:",error:error.message});
    }

    finally{
        await session.endSession();
    }

}

const endRental = async (req,res) =>{
    const session = await rental.startSession();
    session.startTransaction();

    try{
        const rentalid = req.params.id;
        const myRental = await rental.findById(rentalid).session(session);
        if(!myRental){
            throw {status: 404, message:"Rental not found"};
        }
        if(myRental.status != 'Active'){
            throw {status: 400, message:"Tool not in use"};
        }
        if(myRental.renter.toString() != req.user.id){
            throw {status: 403, message:"Not authorised to end the rental"};
        }

        const findTool = myRental.tool;
        const myTool = await tool.findById(findTool).session(session);
        if(!myTool || !myTool.renter || myTool.renter.toString() != req.user.id){
            throw {status: 400, message:"Not renting tool"};
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
        return res.status(error.status || 500).json({message:"Error:",error:error.message});
    }

    finally{
        await session.endSession();
    }

}

module.exports = {startRental,endRental};
