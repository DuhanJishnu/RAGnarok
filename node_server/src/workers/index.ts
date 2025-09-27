import { createWorker } from './workerConfig';
import { imageProcessingWorker } from './imageProcessingWorker';
import { audioProcessingWorker } from './audioProcessingWorker';
import { pdfProcessingWorker } from './pdfProcessingWorker';
import { documentProcessingWorker } from './documentProcessingWorker';

export const startWorkers = () => {
  console.log('Starting workers...');

  // Create and start workers
  const imageWorker = createWorker('image-processing', imageProcessingWorker);
  const audioWorker = createWorker('audio-processing', audioProcessingWorker);
  const pdfWorker = createWorker('pdf-processing', pdfProcessingWorker);
  const documentWorker = createWorker('document-processing', documentProcessingWorker);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down workers...');
    
    await Promise.all([
      imageWorker.close(),
      audioWorker.close(),
      pdfWorker.close(),
      documentWorker.close()
    ]);
    
    console.log('All workers stopped');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return {
    imageWorker,
    audioWorker,
    pdfWorker,
    documentWorker
  };
};

export { 
  imageProcessingWorker, 
  audioProcessingWorker, 
  pdfProcessingWorker, 
  documentProcessingWorker, 
  createWorker 
};
