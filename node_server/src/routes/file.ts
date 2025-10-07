import { Router } from 'express';
import multer from 'multer';
import { errorHandler } from '../error-handler';
import { upload, getJobStatus, serveFile, serveThumbnail, getUnprocessedFiles, updateFileStatus,getDocumentsByPage,getDocumentsByName,getDocumentsByEncrypterID, deleteDocumentByEncryptedId, getFileNamesById } from '../controllers/file';
import { uploadFileValidation } from '../middlewares/secureFileValidation';

  const fileRoutes: Router = Router();

  // Configure multer for memory storage
  const storage = multer.memoryStorage();
  const uploadMiddleware = multer({ 
    storage: storage,
  });

// Routes
fileRoutes.post('/upload', 
  uploadMiddleware.array('files'), 
  uploadFileValidation, // Add secure file validation with magic number detection
  errorHandler(upload)
);
fileRoutes.get('/job/:id', errorHandler(getJobStatus));
fileRoutes.get('/files/:encryptedId', errorHandler(serveFile));
fileRoutes.get('/thumb/:encryptedId', errorHandler(serveThumbnail));
fileRoutes.get('/unprocessed', errorHandler(getUnprocessedFiles)); 
fileRoutes.patch('/update-status', errorHandler(updateFileStatus)); 
fileRoutes.post('/fetchdocuments', errorHandler(getDocumentsByPage));  
fileRoutes.post('/fetchdocumentsbyName', errorHandler(getDocumentsByName )); 
fileRoutes.post('/fetchdocumentsbyID', errorHandler(getDocumentsByEncrypterID));
fileRoutes.delete('/delete', errorHandler(deleteDocumentByEncryptedId));
fileRoutes.post('/getFileNamesbyId', errorHandler(getFileNamesById));

  export default fileRoutes;