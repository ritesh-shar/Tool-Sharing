const { create } = require('../models/rental.js');
const tool = require('../models/tool.js');

const addTool = async(req,res)=>{
    try{
        const {toolName,description,location,images,pricePerHour} = req.body;
        if(!toolName || !description || !location || !images || !pricePerHour){
            return res.status(400).json({message:"Please fill all fields"});
        }

        if(pricePerHour <=0 ){
            return res.status(400).json({message:"Enter a valid amount"})
        }

        const addNewTool = await tool.create({
            toolName: toolName,
            owner: req.user.id,
            description: description,
            location: location,
            images:images,
            pricePerHour: pricePerHour
        })

        return res.status(201).json({addNewTool});
    }
    catch(error){
        return res.status(500).json({message:"Error",error:error.message})
    }
}

const getAllTools = async(req,res)=>{
    try{
        const filter = {};
        if(req.query.location){
            filter.location = req.query.location;
        }
        if(req.query.toolName){
            filter.toolName = {$regex: req.query.toolName, $options: 'i'};
        }
        if(req.query.isAvailable){
            filter.isAvailable = req.query.isAvailable === 'true';
        }
        if(req.query.owner){
            filter.owner = req.query.owner;
        }
        if(req.query.minPrice || req.query.maxPrice){
            filter.pricePerHour = {};
            filter.pricePerHour.$gte = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
            filter.pricePerHour.$lte = req.query.maxPrice ? parseFloat(req.query.maxPrice) : Number.MAX_SAFE_INTEGER;
        }
        const page = Math.max(1,parseInt(req.query.page) || 1);
        const limit = Math.max(1,parseInt(req.query.limit) || 10);
        const skip = (page-1)*limit;
        const [total, allTools] = await Promise.all([
            tool.countDocuments(filter),
            tool.find(filter).populate('owner','name').skip(skip).limit(limit).sort({createdAt: -1})
        ]);
        const totalpages = Math.max(1,Math.ceil(total/limit));
        return res.status(200).json({allTools,total,totalpages});
    }

    catch(error){
        return res.status(500).json({message:"Error",error:error.message})
    }

}

const getMyTools = async(req,res)=> {
    try{
        const myTools = await tool.find({owner: req.user.id});
        return res.status(200).json({myTools});
    }

    catch(error){
        return res.status(500).json({message:"Error",error:error.message})
    }

}

const deleteTool = async (req,res) => {
    try{
        const foundTool = await tool.findById(req.params.id);
        if(!foundTool){
            return res.status(404).json({message:"Tool not found"})
        }

        if(foundTool.owner.toString() != req.user.id){
            return res.status(403).json({message:"Not authorized to delete tool"});
        }

        if(!foundTool.isAvailable){
            return res.status(400).json({message:"Tool is in use"});
        }

        await foundTool.deleteOne();
        return res.status(200).json({message:"Tool deleted"});

    }

    catch(error){
        return res.status(500).json({message:"Error",error:error.message})
    }

}

module.exports = {addTool,getAllTools,getMyTools,deleteTool};
