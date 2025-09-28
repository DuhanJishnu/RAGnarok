import { Job } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { updateDocumentStatus } from '../lib/dbOperations';
import { FileService } from '../services/file';

interface VideoProcessingData {
  documentId: number;
  filePath: string;
  originalname: string;
  finalFilePath: string;
  finalLink: string;
  finalThumbLink: string;
}

export const videoProcessingWorker = async (job: Job<VideoProcessingData>) => {
  const { 
    documentId, 
    filePath, 
    originalname,
    finalFilePath,
    finalLink,
    finalThumbLink 
  } = job.data;

  try {
    console.log(`Processing video: ${filePath}`);
    
    // Update job progress
    await job.updateProgress(10);

    // Ensure the output directory exists
    const outputDir = path.dirname(finalFilePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    await job.updateProgress(20);

    // Process the video - ensure FFmpeg completes fully
    await new Promise<void>((resolve, reject) => {
      const ffmpegCommand = ffmpeg(filePath)
        .output(finalFilePath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('mp4')
        .on('progress', (progress: any) => {
          const percent = Math.round(progress.percent || 0);
          job.updateProgress(20 + (percent * 0.6)); // 20% to 80%
        })
        .on('end', () => {
          // Ensure FFmpeg process is fully closed before resolving
          setTimeout(() => resolve(), 100);
        })
        .on('error', reject);
      
      ffmpegCommand.run();
    });
    
    await job.updateProgress(80);

    // Create thumbnail from video - ensure FFmpeg completes fully
    const thumbDir = path.join(outputDir, '..', 'thumb');
    await fs.mkdir(thumbDir, { recursive: true });
    
    const thumbPath = path.join(thumbDir, path.basename(finalFilePath, path.extname(finalFilePath)) + '.jpg');
    
    await new Promise<void>((resolve, reject) => {
      const thumbnailCommand = ffmpeg(finalFilePath)
        .screenshots({
          timestamps: ['1'],
          filename: path.basename(thumbPath),
          folder: path.dirname(thumbPath),
          size: '150x150'
        })
        .on('end', () => {
          // Ensure FFmpeg process is fully closed before resolving
          setTimeout(() => resolve(), 100);
        })
        .on('error', reject);
      
      thumbnailCommand.run();
    });
    
    await job.updateProgress(85);

    // Get file stats
    const stats = await fs.stat(finalFilePath);
    const finalSizeInMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

    // Update database
    await updateDocumentStatus({
      documentId,
      documentPath: finalFilePath,
      currentFileSize: finalSizeInMB,
      isCompressed: true,
      thumbFilePath: thumbPath
  });
    
    await job.updateProgress(95);

    // Add delay to ensure all FFmpeg operations are complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Clean up temp file with retry logic
    await FileService.safeDeleteFile(filePath);
    
    await job.updateProgress(100);

    console.log(`Video processing completed for document ${documentId}`);
    
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
    console.error(`Video processing failed for document ${documentId}:`, error);
    
    // Clean up temp file on error
    await FileService.safeDeleteFile(filePath);
    
    throw error;
  }
};
