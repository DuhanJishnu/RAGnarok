import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
const prismaClient = prisma;

const pageSize: number = 15

export const getRecentConversations =async(req: Request, res:Response)=>{
    console.log("conv_0");
    const page = Number(req.query.page);
    console.log("req_user",req.user, "page : ", page);
    const userId=req.user?.id;
    console.log("conv_1");

    const conversations = await prismaClient.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    });
    console.log("conv_2");
    const totalCount = await prismaClient.conversation.count({
    where: { userId },
    });
    console.log("conv_3");
    res.json(
    {conversations,
    pagination: {
      page,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },}
    );
}
