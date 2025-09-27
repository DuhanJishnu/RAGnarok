import { Router} from 'express';
import { errorHandler } from '../error-handler';
import authMiddleware from '../middlewares/auth';
import { getExchanges, createExchange } from '../controllers/exchange';
const exchRoutes:Router = Router();

exchRoutes.get('/getexch',[authMiddleware],errorHandler(getExchanges));
exchRoutes.post('/createexch',[authMiddleware],errorHandler(createExchange));


export default exchRoutes;