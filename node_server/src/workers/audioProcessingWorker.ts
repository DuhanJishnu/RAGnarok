import { Job } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { updateDocumentStatus } from '../lib/dbOperations';
import { FileService } from '../services/file';

interface AudioProcessingData {
  documentId: number;
  filePath: string;
  originalname: string;
  finalFilePath: string;
  finalLink: string;
  finalThumbLink: string;
}

export const audioProcessingWorker = async (job: Job<AudioProcessingData>) => {
  const { 
    documentId, 
    filePath, 
    originalname,
    finalFilePath,
    finalLink,
    finalThumbLink 
  } = job.data;

  try {
    console.log(`Processing audio: ${filePath}`);
    
    // Update job progress
    await job.updateProgress(10);

    // Ensure the output directory exists
    const outputDir = path.dirname(finalFilePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    await job.updateProgress(20);

    // Compress audio file using ffmpeg
    const compressedAudioPath = path.join(path.dirname(finalFilePath), 
      path.basename(finalFilePath, path.extname(finalFilePath)) + '_compressed' + path.extname(finalFilePath));
    
    await new Promise<void>((resolve, reject) => {
      const ffmpegCommand = ffmpeg(filePath)
        .output(compressedAudioPath)
        .audioCodec('libmp3lame') // Use MP3 for compression
        .audioBitrate(128) // 128 kbps for good quality compression
        .format('mp3')
        .on('progress', (progress: any) => {
          const percent = Math.round(progress.percent || 0);
          job.updateProgress(20 + (percent * 0.5)); // 20% to 70%
        })
        .on('end', () => {
          // Ensure FFmpeg process is fully closed before resolving
          setTimeout(() => resolve(), 100);
        })
        .on('error', reject);
      
      ffmpegCommand.run();
    });
    
    // Use the compressed file as the final file
    await fs.rename(compressedAudioPath, finalFilePath);
    
    await job.updateProgress(70);

    // Create a waveform thumbnail for audio files (optional)
    const thumbDir = path.join(outputDir, '..', 'thumb');
    await fs.mkdir(thumbDir, { recursive: true });
    
    const thumbPath = path.join(thumbDir, path.basename(finalFilePath, path.extname(finalFilePath)) + '_waveform.png');
    
    // Generate waveform thumbnail
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(finalFilePath)
          .complexFilter([
            '[0:a]showwavespic=s=400x100:colors=0x3498db[v]'
          ])
          .outputOptions(['-map', '[v]'])
          .output(thumbPath)
          .on('end', () => {
            setTimeout(() => resolve(), 100);
          })
          .on('error', (err) => {
            console.warn('Failed to generate audio waveform, skipping thumbnail:', err.message);
            resolve(); // Don't fail the job if thumbnail generation fails
          })
          .run();
      });
    } catch (error) {
      console.warn('Waveform generation failed, continuing without thumbnail');
    }
    
    await job.updateProgress(80);

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

    // Add delay to ensure all file operations are complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clean up temp file with retry logic
    await FileService.safeDeleteFile(filePath);
    
    await job.updateProgress(100);

    console.log(`Audio processing completed for document ${documentId}`);
    
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
    console.error(`Audio processing failed for document ${documentId}:`, error);
    
    // Clean up temp file on error
    await FileService.safeDeleteFile(filePath);
    
    throw error;
  }
};
