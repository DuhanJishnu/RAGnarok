import { Router} from 'express';
import { errorHandler } from '../error-handler';
import authMiddleware from '../middlewares/auth';
import { getRecentConversations } from '../controllers/conversation';

const convRoutes:Router = Router();

convRoutes.get('/getrecentconv',[authMiddleware],errorHandler(getRecentConversations));

export default convRoutes;