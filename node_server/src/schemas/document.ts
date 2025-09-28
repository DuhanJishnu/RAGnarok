import { z } from 'zod';

export const insertInitialDocumentSchema = z.object({
  docType: z.number().int(),
  displayName: z.string(),
  encryptedId: z.string(),
  originalSize: z.number(),
  fileExt: z.string(),
});

export const updateDocumentStatusSchema = z.object({
  documentId: z.number().int(),
  documentPath: z.string(),
  currentFileSize: z.preprocess((val) => {
    if (typeof val === 'string') return parseFloat(val);
    return val;
  }, z.number()),
  isCompressed: z.preprocess((val) => {
    if (typeof val === 'number') return val === 1;
    if (typeof val === 'string') return parseInt(val) === 1;
    return val;
  }, z.boolean()),
  thumbFilePath: z.string().nullable(),
});
