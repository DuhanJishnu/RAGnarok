import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
const prismaClient = prisma;

const pageSize: number = 15

export const getRecentConversations =async(req: Request, res:Response)=>{
    const {page}=req.body;
    const userId=req.user.id;

    const conversations = await prismaClient.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    });
    const totalCount = await prismaClient.conversation.count({
    where: { userId },
    });
    res.json(
    {conversations,
    pagination: {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },}
    );
}
