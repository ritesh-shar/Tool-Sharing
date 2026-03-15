const tool = require('../models/tool.js');
const asyncHandler = require('../utility/asyncHandler.js');
const {toolZodSchema} = require('../validationSchemas/toolValidator.js');

const addTool = asyncHandler(async(req,res)=>{
            const data = toolZodSchema.parse(req.body);        
            const addNewTool = await tool.create({
            toolName: data.toolName,
            owner: req.user.id,
            description: data.description,
            location: data.location,
            images:data.images,
            pricePerHour: data.pricePerHour
        })

        return res.status(201).json({addNewTool});

})

const getAllTools = asyncHandler(async(req,res)=>{
        const filter = {isDeleted: false};
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
        res.status(200).json({
            success: true,
            total,
            totalpages,
            currentPage: page,
            tools: allTools
        })
})

const getMyTools = asyncHandler(async(req,res)=> {
        const page = Math.max(1,parseInt(req.query.page) || 1);
        const limit = Math.max(1,parseInt(req.query.limit) || 10);
        const skip = (page-1)*limit;
        const filter = {owner: req.user.id, isDeleted: false};
        const [total, myTools] = await Promise.all([
            tool.countDocuments(filter),
            tool.find(filter).populate('owner','name').skip(skip).limit(limit).sort({createdAt: -1})
        ]);
        const totalpages = Math.max(1,Math.ceil(total/limit));
        return res.status(200).json({
            success: true,
            total,
            totalpages,
            currentPage: page,
            tools: myTools
        });
})

const deleteTool = asyncHandler(async (req,res) => {
        const foundTool = await tool.findOne({ _id: req.params.id, isDeleted: false });
        if(!foundTool){
            const error = new Error("Tool not found");
            error.statusCode = 404;
            throw error;
        }

        if(foundTool.owner.toString() != req.user.id){
            const error = new Error("Not authorized to delete tool");
            error.statusCode = 403;
            throw error;
        }

        if(!foundTool.isAvailable){
            const error = new Error("Tool is currently rented out and cannot be deleted");
            error.statusCode = 400;
            throw error;
        }

        await foundTool.updateOne({isDeleted: true});
        return res.status(200).json({message:"Tool deleted"});


})

module.exports = {addTool,getAllTools,getMyTools,deleteTool};
