import {Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized";
import { ErrorCode } from "../exceptions/root";
import * as jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET} from "../config/envExports";
import {prisma} from "../config/prisma"
import {refresh} from "../controllers/auth"

const prismaClient = prisma; 

const authMiddleware = async(req:Request, res:Response, next:NextFunction)=>{
    //1. extract token from header
    console.log('a');
    const access_token = req.cookies.access_token;
    console.log('b');
    //2. if !token throw error of unauthorized
    if(!access_token){
        return next(new UnauthorizedException("Unauthorized",ErrorCode.UNAUTHORIZED))
    }
    try{
         //3. if token is present -> verify it extract the payload
        const payload:any = jwt.verify(access_token,JWT_ACCESS_SECRET)
        console.log('c : ', payload);
        console.log(" body", req.body);
        //4. to get the user from the payload
        const user=await prismaClient.user.findFirst({
            where:{
                id: payload.userId
            }
        })
        
        console.log('c.2');
        if(!user){
            next(new UnauthorizedException("Unauthorized",ErrorCode.UNAUTHORIZED));
            return;
        }
        console.log('d');
        //5. to attach the user the user to the current request object
        req.user={...user}
        console.log('e');
        next()
    }catch(error){
        console.log('error caught');
        next(new UnauthorizedException("Unauthorized",ErrorCode.UNAUTHORIZED))
        console.log(error);
    }
}
export default authMiddleware;