const {z} = require('zod');

const toolZodSchema = z.object({
    toolName: z.string().min(3),
    description: z.string().min(10),
    pricePerHour: z.number().positive(),
    location: z.string(),
    images: z.array(z.string().url())
})

module.exports = {toolZodSchema};
