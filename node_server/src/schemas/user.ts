import {z} from 'zod';

export const SignupSchema=z.object({
    fullname: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6)
})
export const LoginSchema=z.object({
    email: z.string().email(),
    password: z.string().min(6)
})