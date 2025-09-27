import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { Conversation } from "../types/conversation";

const prismaClient = prisma;

const pageSize: number = 15;

export const createExchange = async (req: Request, res: Response) => {
  const { user_query, convId } = req.body;
  let { convTitle } = req.body;
  let newConversation: Conversation | null = null;
  let conversationId = convId;

  if(!convTitle){
    convTitle = "A new Title";
  }
  if (!conversationId) {
    newConversation = await prismaClient.conversation.create({
      data: {
        userId: req.user.id,
        title: convTitle,
      },
    });
    conversationId = newConversation.id;
  }

  await prismaClient.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  const systemResponse: string = "I am a helpful assistant.";

  const exchange = await prismaClient.exchange.create({
    data: {
      userQuery: user_query,
      conversationId,
      systemResponse,
    },
  });
  return res.status(200).json({
    exchange,
    conversation: newConversation,
  });
};

export const getExchanges = async (req: Request, res: Response) => {
  const { conversationId, page } = req.body;
  const exchanges = await prismaClient.exchange.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  res.json({
    exchanges,
  });
};
