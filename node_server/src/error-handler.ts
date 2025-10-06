import { NextFunction, Request, Response } from "express";
import { ErrorCode, HttpException } from "./exceptions/root";
import { InternalException } from "./exceptions/internal-exception";


export const errorHandler =(method : Function) =>{
    return async(req:Request,res:Response,next:NextFunction)=>{
        try{
           await method(req,res,next);
        }catch(error:any){
            console.log(error);
            let exception:HttpException;
            if(error instanceof HttpException){
                //it is handled already
                exception=error;
            } // else if (error instanceof Prisma.PrismaClientKnownRequestError){}
            else{
                exception = new InternalException('Something went wrong',error,ErrorCode.INTERNAL_EXCEPTION)
            }
            next(exception);
        }
    }
}