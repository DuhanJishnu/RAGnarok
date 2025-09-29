import { NextFunction, Request, Response } from "express";
import { FileService } from "../services/file";
import { updateFileStatusSchema } from "../schemas/document";

/**
 * Upload controller - handles file uploads
 */
export const upload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query;
    const payload = req.body;
    
    // Validate request
    if (!payload?.projectName || !payload?.directory) {
      return res.status(400).json({ error: 'Project name and directory are required' });
    }

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    
    // Process files using service
    const results = await FileService.processUploadedFiles(files, payload, query);

    res.status(200).json({
      message: 'Files are being processed in background',
      files: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * Get job status controller
 */
export const getJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.id;
    const fileType = req.query.fileType as string || '1';

    const jobStatus = await FileService.getJobStatus(jobId, fileType);
    res.json(jobStatus);
  } catch (error) {
    next(error);
  }
};

/**
 * Serve file controller
 */
export const serveFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const encryptedId = req.params.encryptedId;
    const { filePath, mimeType } = await FileService.getFileByEncryptedId(encryptedId);
    
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Serve thumbnail controller
 */
export const serveThumbnail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const encryptedId = req.params.encryptedId;
    const { filePath, mimeType } = await FileService.getThumbnailByEncryptedId(encryptedId);
    
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

export const getUnprocessedFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unprocessedFiles = await FileService.getUnprocessedFiles();
    res.json(unprocessedFiles);
  } catch (error) {
    next(error);
  }
};

export const updateFileStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = updateFileStatusSchema.safeParse(req.body); 
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Invalid request data', details: parsedBody.error });
    }

    const { documentId, status, retriesCount } = parsedBody.data;

    const result = await FileService.updateFileStatus(documentId, status, retriesCount);
    if (result.success === true) {
      return res.status(200).json({ message: 'File status updated successfully' });
    } else {
      return res.status(400).json({ error: result.message });
    }
  } catch (error) {
    next(error);
  }
};
