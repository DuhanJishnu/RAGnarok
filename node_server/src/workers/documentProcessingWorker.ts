import { Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import * as zlib from 'zlib';
import { updateDocumentStatus } from '../lib/dbOperations';
import { FileService } from '../services/file';

interface DocumentProcessingData {
  documentId: number;
  filePath: string;
  originalname: string;
  finalFilePath: string;
  finalLink: string;
  finalThumbLink: string;
}

export const documentProcessingWorker = async (job: Job<DocumentProcessingData>) => {
  const { 
    documentId, 
    filePath, 
    originalname,
    finalFilePath,
    finalLink,
    finalThumbLink 
  } = job.data;

  try {
    console.log(`Processing document: ${filePath}`);
    
    // Update job progress
    await job.updateProgress(10);

    // Ensure the output directory exists
    const outputDir = path.dirname(finalFilePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    await job.updateProgress(20);

    // For MS Word/document files, compress them using gzip
    const compressedPath = path.join(path.dirname(finalFilePath), 
      path.basename(finalFilePath, path.extname(finalFilePath)) + '.gz');
    
    await new Promise<void>((resolve, reject) => {
      const input = require('fs').createReadStream(filePath);
      const output = require('fs').createWriteStream(compressedPath);
      const gzip = zlib.createGzip({ level: 9 }); // Maximum compression

      input.pipe(gzip).pipe(output);

      output.on('close', () => {
        console.log('Document compressed successfully');
        resolve();
      });

      output.on('error', reject);
      input.on('error', reject);
      gzip.on('error', reject);
      
      // Update progress during compression
      let processed = 0;
      input.on('data', (chunk: Buffer) => {
        processed += chunk.length;
        job.updateProgress(20 + (processed / (1024 * 1024)) * 10); // Approximate progress
      });
    });

    // Move compressed file to final location  
    await fs.rename(compressedPath, finalFilePath);
    
    await job.updateProgress(70);

    // Create thumbnail directory and generate document preview
    const thumbDir = path.join(outputDir, '..', 'thumb');
    await fs.mkdir(thumbDir, { recursive: true });
    
    // Generate a simple document icon thumbnail (since we can't easily preview compressed documents)
    const thumbPath = path.join(thumbDir, path.basename(finalFilePath, path.extname(finalFilePath)) + '_doc_icon.png');
    
    let actualThumbPath = null;
    
    // Create a simple document icon using canvas or a placeholder
    // For now, we'll create a simple text-based thumbnail indicating it's a document
    try {
      const documentInfo = `Document: ${path.basename(originalname)}\nType: ${path.extname(originalname).toUpperCase()}\nCompressed: GZIP`;
      
      // Create a simple text file that can be used as metadata (not an actual thumbnail for now)
      const metaPath = path.join(thumbDir, path.basename(finalFilePath, path.extname(finalFilePath)) + '_info.txt');
      await fs.writeFile(metaPath, documentInfo);
      
      // Set thumbPath to null since we're not generating an actual image thumbnail
      actualThumbPath = null;
      
      await job.updateProgress(80);
    } catch (error) {
      console.warn('Document metadata generation failed, continuing without thumbnail');
      actualThumbPath = null;
    }

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
      actualThumbPath
    );
    
    await job.updateProgress(95);

    // Add delay to ensure all file operations are complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clean up temp file with retry logic
    await FileService.safeDeleteFile(filePath);
    
    await job.updateProgress(100);

    console.log(`Document processing completed for document ${documentId}`);
    
    return {
      documentId,
      finalPath: finalFilePath,
      thumbPath: actualThumbPath,
      finalSizeInMB,
      links: {
        file: finalLink,
        thumb: finalThumbLink
      }
    };

  } catch (error) {
    console.error(`Document processing failed for document ${documentId}:`, error);
    
    // Clean up temp file on error
    await FileService.safeDeleteFile(filePath);
    
    throw error;
  }
};
