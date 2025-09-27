import { Router } from 'express';
import multer from 'multer';
import { errorHandler } from '../error-handler';
import { upload, getJobStatus, serveFile, serveThumbnail } from '../controllers/file';

const fileRoutes: Router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ 
  storage: storage,
});

// Routes
fileRoutes.post('/upload', uploadMiddleware.array('files'), errorHandler(upload));
fileRoutes.get('/job/:id', errorHandler(getJobStatus));
fileRoutes.get('/files/:encryptedId', errorHandler(serveFile));
fileRoutes.get('/thumb/:encryptedId', errorHandler(serveThumbnail));

export default fileRoutes;