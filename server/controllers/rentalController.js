const rental = require('../models/rental.js');
const tool = require('../models/tool.js');

const startRental = async (req,res) => {
    try{
    const toolId = req.params.id;
    const renterId = req.user.id;
    
    const toolToRent = await tool.findById(toolId);
    if(!toolToRent){
        return res.status(404).json({message:"Tool not found"});
    }
    if(toolToRent.owner.toString() === renterId){
        return res.status(403).json({message:"Cannot rent what you own"});
    }

    if(!toolToRent.isAvailable){
        return res.status(400).json({message:"Tool already in use"});
    }

    const newRental = await rental.create({
        renter: renterId,
        owner: toolToRent.owner,
        tool: toolToRent._id,
        pricePerHour: toolToRent.pricePerHour,
        status:'Active'
    })

    toolToRent.isAvailable = false;
    toolToRent.renter = renterId;
    await toolToRent.save();

    return res.status(201).json({
        rentalid: newRental.id,
        toolId: toolToRent.id,
        starttime: newRental.rentTimeStart,
    })

    }

    catch(error){
        return res.status(500).json({message:"Error:",error:error.message});
    }

}

const endRental = async (req,res) =>{

    try{
        const rentalid = req.params.id;
        const myRental = await rental.findById(rentalid)
        if(!myRental){
            return res.status(404).json({message:"Rental not found"});
        }
        if(myRental.status != 'Active'){
            return res.status(400).json({message:"Tool not in use"});
        }
        if(myRental.renter.toString() != req.user.id){
            return res.status(403).json({message:"Not authorised to end the rental"});
        }

        const findTool = myRental.tool;
        const myTool = await tool.findById(findTool);
        if(!myTool || !myTool.renter || myTool.renter.toString() != req.user.id){
            return res.status(400).json({message:"Not renting tool"});
        }

        myRental.status = 'Completed';
        myRental.rentTimeEnd = Date.now();

        const durationMS = myRental.rentTimeEnd - myRental.rentTimeStart;
        const hours = Math.ceil(durationMS/(1000*60*60));
        myRental.totalCost = myRental.pricePerHour*hours;

        myTool.isAvailable = true;
        myTool.renter = null;
    
        await myTool.save();
        await myRental.save();

        return res.status(200).json({
            message:"Rental Ended",
            totalCost: myRental.totalCost
        });

    }
    catch(error){
        return res.status(500).json({message:"Error:",error:error.message});
    }

}

module.exports = {startRental,endRental};
