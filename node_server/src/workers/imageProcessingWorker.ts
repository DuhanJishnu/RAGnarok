import { Job } from 'bullmq';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { updateDocumentStatus } from '../lib/dbOperations';
import { FileService } from '../services/file';

interface ImageProcessingData {
  documentId: number;
  filePath: string;
  width: number;
  height: number;
  quality: number;
  fileName: string;
  finalFilePath: string;
  finalLink: string;
  finalThumbLink: string;
}

export const imageProcessingWorker = async (job: Job<ImageProcessingData>) => {
  const { 
    documentId, 
    filePath, 
    width, 
    height, 
    quality, 
    finalFilePath,
    finalLink,
    finalThumbLink 
  } = job.data;

  try {
    console.log(`Processing image: ${filePath}`);
    
    // Update job progress
    await job.updateProgress(10);

    // Ensure the output directory exists
    const outputDir = path.dirname(finalFilePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    await job.updateProgress(20);

    // Process the image - ensure Sharp operations complete fully
    const sharpInstance = sharp(filePath);
    await sharpInstance
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toFile(finalFilePath);
    
    // Explicitly close Sharp instance
    sharpInstance.destroy();
    
    await job.updateProgress(60);

    // Create thumbnail
    const thumbDir = path.join(outputDir, '..', 'thumb');
    await fs.mkdir(thumbDir, { recursive: true });
    
    const thumbPath = path.join(thumbDir, path.basename(finalFilePath));
    
    // Create thumbnail with separate Sharp instance
    const thumbSharpInstance = sharp(filePath);
    await thumbSharpInstance
      .resize(150, 150, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 60 })
      .toFile(thumbPath);
    
    // Explicitly close thumbnail Sharp instance
    thumbSharpInstance.destroy();
    
    await job.updateProgress(80);

    // Get file stats
    const stats = await fs.stat(finalFilePath);
    const finalSizeInMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

    // Update database
    await updateDocumentStatus(
      documentId,
      finalFilePath,
      finalSizeInMB,
      true,
      new Date(),
      thumbPath
    );
    
    await job.updateProgress(90);

    // Add delay to ensure all Sharp operations are complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clean up temp file with retry logic
    await FileService.safeDeleteFile(filePath);
    
    await job.updateProgress(100);

    console.log(`Image processing completed for document ${documentId}`);
    
    return {
      documentId,
      finalPath: finalFilePath,
      thumbPath,
      finalSizeInMB,
      links: {
        file: finalLink,
        thumb: finalThumbLink
      }
    };

  } catch (error) {
    console.error(`Image processing failed for document ${documentId}:`, error);
    
    // Clean up temp file on error
    await FileService.safeDeleteFile(filePath);
    
    throw error;
  }
};
