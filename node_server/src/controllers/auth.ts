import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { hashSync, compareSync } from "bcrypt";
import { BadRequestException } from "../exceptions/bad_request";
import { ErrorCode } from "../exceptions/root";
import { UnprocessableEntity } from "../exceptions/validation";
import { LoginSchema, SignupSchema } from "../schemas/user";
import { generateAccessToken, generateHashRefreshToken, getSafeUser } from "../services/auth";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET } from "../config/envExports";
import { User } from "../types/auth";
import { NotFoundException } from "../exceptions/not-found";

const prismaClient = prisma; 

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
   const parsedBody = SignupSchema.parse(req.body);
   console.log(1);
    const { email, password, username } = parsedBody;
    console.log(2);
    let user = await prismaClient.user.findFirst({
      where: {
        email,
      },
    });
    console.log(3);
    if (user) {
       throw new BadRequestException(
          "User already exists",
          ErrorCode.USER_ALREADY_EXISTS
        );
    }
    console.log(4);
    user = await prismaClient.user.create({
      data: {
        email,
        password: hashSync(password, 10),
        username,
      },
    });
    console.log(5)
    const access_token = generateAccessToken(user.id);

    const refresh_token = await generateHashRefreshToken(user.id);

console.log(6);
    res.cookie("access_token", access_token, {
      httpOnly: true,       // not accessible via JS
      //secure: true,         // only over HTTPS (set false in dev)
      sameSite: "strict",   // CSRF protection
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      //secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log(7);
    res.json({
      id: user.id,
      email: user.email,
      username: user.username
    });
    
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  LoginSchema.parse(req.body);
  console.log(1);
    const { email, password } = req.body;
    let user:User = await prismaClient.user.findUnique({ where: { email } });

    console.log(2);
    if (!user) {throw new NotFoundException("User not found",ErrorCode.USER_NOT_FOUND)}
    if (!compareSync(password, user.password)) {
          throw new BadRequestException(
          "Incorrect Credentials",
          ErrorCode.INCORRECT_CREDENTIALS);
    }
    console.log(3);
    const access_token = generateAccessToken(user.id);
    const refresh_token = await generateHashRefreshToken(user.id);
    res.cookie("access_token", access_token, {
      httpOnly: true,       // not accessible via JS
         // only over HTTPS (set false in dev)
      sameSite: "strict",   // CSRF protection
      maxAge: 15 * 60 * 1000,
    });
console.log(4);
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,

      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log(5);
    res.json({
      id: user.id,
      email: user.email,
      username: user.username
    });
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {


  const { refresh_token } = req.body;

  if (!refresh_token)
    return res.status(401).json({ message: "Missing token" });

  try {

    const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: string };
    const storedTokenEntry = await prismaClient.refreshToken.findUnique({
      where: { tokenHash:refresh_token },
    });

    if (!storedTokenEntry) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    if (storedTokenEntry.expiresAt < new Date()) {
      await prismaClient.refreshToken.delete({
        where: { tokenHash:refresh_token },
      });
      
      return res.status(403).json({ message: "Refresh token expired" });
    }
    const access_token = generateAccessToken(decoded.userId);
 
    const new_refresh_token = await generateHashRefreshToken(decoded.userId);
 
    
    await prismaClient.refreshToken.delete({
      where: { tokenHash:refresh_token },
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,    
           
      sameSite: "strict",   
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", new_refresh_token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      message:"Updated token"
    })
  } catch (err: any) {
    next(
      new UnprocessableEntity(
        err?.issues || err,
        "Could not generate tokens",
        ErrorCode.TOKEN_ERROR
      )
    );
  }
};

export const me = async (req: Request, res: Response) => {
  console.log(1);
  const safeUser = getSafeUser(req.user);
  console.log(2);
  res.json(safeUser);
};

export const logout = async (req: Request, res: Response) =>{
  await prismaClient.refreshToken.delete({
    where:{tokenHash: req.cookies.refresh_token}
  })
   res.clearCookie("access_token", {
    httpOnly: true,
    //secure: true,
    sameSite: "strict"
  });
   res.clearCookie("refresh_token", {
    httpOnly: true,
    //secure: true,
    sameSite: "strict"
  });
  res.json({ message: "Logged out successfully" });
}