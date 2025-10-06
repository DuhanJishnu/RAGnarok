import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../config/envExports";
import {User, SafeUser} from '../types/auth'
import { prisma } from "../config/prisma";
const ACCESS_TOKEN_EXPIRY ="15min"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const prismaClient = prisma; 

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId: userId }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

export const generateHashRefreshToken = async (userId: string) => {
  const refresh_token = jwt.sign({ userId: userId }, JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
  });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prismaClient.refreshToken.create({
    data: {
      userId: userId,
      tokenHash:refresh_token,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      ),
    },
  });
  return refresh_token;
};

export const getSafeUser=(user: User): SafeUser => {
  return {
    ...user,
    password: null,
  };
}