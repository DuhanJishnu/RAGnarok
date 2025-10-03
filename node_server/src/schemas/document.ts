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
  pageNo: z.coerce
    .number()
    .int()
    .min(1, "Page number must be at least 1")
    .default(1),

  docType: z.coerce
    .number()
    .int()
    .min(0, "Document type must be at least 0")
    .max(4, "Document type must be at most 4")
    .default(0),
});


export const fetchDocumentsByNameSchema = z.object({
  pageNo: z.preprocess((val) => parseInt(String(val)), z.number().int().min(1)),
  name: z.string().min(1, "Search term cannot be empty"),
  docType: z.coerce
    .number()
    .int()
    .min(0, "Document type must be at least 0")
    .max(4, "Document type must be at most 4")
    .default(0),

});

export const fetchDocumentsByIdSchema = z.object({
  id: z.string().min(1, "Encrypted document ID is required"),
});

