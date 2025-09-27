import {Conversation} from './conversation';
export interface Exchange {
  id: string;
  userQuery: string;
  systemResponse: string;
  createdAt: Date;
  conversationId: string;

  conversation?: Conversation;
}