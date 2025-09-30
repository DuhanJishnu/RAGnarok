import { Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import { updateDocumentStatus } from '../lib/dbOperations';
import { compressPDF } from '../lib/compressPdf';
import { FileService } from '../services/file';

interface PdfProcessingData {
  documentId: number;
  filePath: string;
  finalFilePath: string;
}

export const pdfProcessingWorker = async (job: Job<PdfProcessingData>) => {
  const { documentId, filePath, finalFilePath } = job.data;

  try {
    console.log(`Processing PDF: ${filePath}`);
    
    // Update job progress
    await job.updateProgress(10);

    // Ensure the output directory exists
    const outputDir = path.dirname(finalFilePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    await job.updateProgress(20);

    // Compress the PDF
    const { compressedPdfPath, thumbnailPath } = await compressPDF(filePath, finalFilePath);

    await job.updateProgress(80);

    // Get file stats
    const stats = await fs.stat(compressedPdfPath);
    const finalSizeInMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

    // Update database
    await updateDocumentStatus({
      documentId,
      documentPath: compressedPdfPath,
      currentFileSize: finalSizeInMB,
      isCompressed: true,
      thumbFilePath: thumbnailPath
  });
    
    await job.updateProgress(95);

    // Add delay to ensure PDF operations are complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clean up temp file with retry logic
    await FileService.safeDeleteFile(filePath);
    
    await job.updateProgress(100);

    console.log(`PDF processing completed for document ${documentId}`);
    
    return {
      documentId,
      finalPath: compressedPdfPath,
      finalSizeInMB
    };

  } catch (error) {
    console.error(`PDF processing failed for document ${documentId}:`, error);
    
    // Clean up temp file on error
    await FileService.safeDeleteFile(filePath);
    
    throw error;
  }
};
