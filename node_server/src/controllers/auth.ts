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
import { User, SafeUser } from "../types/auth";
import { NotFoundException } from "../exceptions/not-found";

const prismaClient = prisma; 

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
   const parsedBody = SignupSchema.parse(req.body);
    const { email, password, username } = parsedBody;
    let user = await prismaClient.user.findFirst({
      where: {
        email,
      },
    });
    if (user) {
       throw new BadRequestException(
          "User already exists",
          ErrorCode.USER_ALREADY_EXISTS
        );
    }
    user = await prismaClient.user.create({
      data: {
        email,
        password: hashSync(password, 10),
        username,
      },
    });
    const access_token = generateAccessToken(user.id);

    const refresh_token = await generateHashRefreshToken(user.id);


    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      access_token,
      refresh_token,
    });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  LoginSchema.parse(req.body);
    const { email, password } = req.body;
    let user:User = await prismaClient.user.findUnique({ where: { email } });

    if (!user) {throw new NotFoundException("User not found",ErrorCode.USER_NOT_FOUND)}

    if (!compareSync(password, user.password)) {
          throw new BadRequestException(
          "Incorrect Credentials",
          ErrorCode.INCORRECT_CREDENTIALS);
    }

    const access_token = generateAccessToken(user.id);
    const refresh_token = await generateHashRefreshToken(user.id);

    res.json({
       id: user.id,
      email: user.email,
      username: user.username,
      access_token,
      refresh_token,
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

    return res.json({
      access_token,
      refresh_token: new_refresh_token,
    });
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

function toSafeUser(user: User): SafeUser {
  return {
    ...user,
    password: null,
  };
}

export const me = async (req: Request, res: Response) => {
  const safeUser = getSafeUser(req.user);
  res.json(safeUser);
};