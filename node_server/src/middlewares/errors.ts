
import { HttpException } from "../exceptions/root";
import { NextFunction,Request, Response } from "express";
import { errorPage } from "../lib/errorPage";

export const errorMiddleware=(error:any,req : Request,res:Response,next:NextFunction)=>{
    if (error instanceof HttpException) {
        const status = error.status || 500;
        // Check if the client accepts HTML
        if (req.accepts('html')) {
            return errorPage(req, res, status, "Error", error.message);
        }
        return res.status(status).json({
            message:error.message,
            errorCode:error.errorCode,
            errors:error.errors
        });
    }

    // For generic errors that are not HttpException
    const status = 500;
    const message = error.message || "An unexpected error occurred.";
    if (req.accepts('html')) {
        return errorPage(req, res, status, "Error Encountered", message);
    }
    res.status(status).json({
        message: message
    });
}