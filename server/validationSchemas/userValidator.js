const {z} = require('zod');

const registerZodSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
})

const loginZodSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

module.exports = {registerZodSchema, loginZodSchema};
