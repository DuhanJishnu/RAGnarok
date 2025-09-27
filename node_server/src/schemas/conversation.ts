import {z} from 'zod';

export const getRecentConversationSchema = z.object({
  page:z.number()
})