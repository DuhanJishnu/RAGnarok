import { User } from "./auth";
import { Exchange } from "./exchange";
export interface Conversation {
  id: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;

  user?: User;
  exchanges?: Exchange[];
}