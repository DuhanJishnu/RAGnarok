import { Router} from 'express';
import { errorHandler } from '../error-handler';
import authMiddleware from '../middlewares/auth';
import { getExchanges, createExchange, streamResponse } from '../controllers/exchange';
const exchRoutes:Router = Router();

exchRoutes.post('/getexch',[authMiddleware],errorHandler(getExchanges));
exchRoutes.post('/createexch', authMiddleware, errorHandler(createExchange));
exchRoutes.get('/stream-response/:responseId', authMiddleware, errorHandler(streamResponse));


export default exchRoutes;