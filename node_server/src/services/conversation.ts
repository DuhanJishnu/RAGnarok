import { prisma } from "../config/prisma";

const prismaClient = prisma;

export const createConversation =async(userId:string, title:string)=>{

    const conversation = await prismaClient.conversation.create({
        data:{
            title,
            userId,
        }
    })
    return conversation
}

export const updateTime= async(conversationId: string) => {
    const conversation = await prismaClient.conversation.update({
        where: {
            id: conversationId,
        },
        data: {
            updatedAt: new Date()
        }
    });
    return conversation.id;
}