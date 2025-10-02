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

export const updateFileStatusSchema = z.object({
  documentId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  retriesCount: z.number().int().optional(),
});


export const fetchDocumentsSchema = z.object({
  pageNo: z.coerce // Coerce (convert) the input to a number
    .number()
    .int()
    .min(1, "Page number must be at least 1")
    .default(1), // If pageNo is not provided, default to 1
  
  docType: z.coerce // Coerce the input to a number
    .number()
    .int()
    .optional(), // It remains optional, if not provided it will be `undefined`
});

export const fetchDocumentsByNameSchema = z.object({
  pageNo: z.preprocess((val) => parseInt(String(val)), z.number().int().min(1)),
  name: z.string().min(1, "Search term cannot be empty"),
});

export const fetchDocumentsByIdSchema = z.object({
  id: z.string().min(1, "Encrypted document ID is required"),
});

