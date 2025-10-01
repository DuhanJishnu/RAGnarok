/**
 * Magic Number File Type Detection Library
 * 
 * This module provides secure file type detection by analyzing the first few bytes 
 * of a file (magic numbers) rather than trusting user-provided filenames or MIME types.
 * This prevents security vulnerabilities where malicious files are disguised as other types.
 */

export interface MagicNumberSignature {
  signature: number[];
  mimeType: string;
  category: string;
  extension: string;
  offset?: number; // Default is 0
  mask?: number[]; // Optional mask for flexible matching
}

/**
 * Comprehensive magic number signatures for file type detection
 */
export const MAGIC_SIGNATURES: MagicNumberSignature[] = [
  // Images
  { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mimeType: 'image/png', category: 'image', extension: 'png' },
  { signature: [0xFF, 0xD8, 0xFF], mimeType: 'image/jpeg', category: 'image', extension: 'jpg' },
  { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mimeType: 'image/gif', category: 'image', extension: 'gif' },
  { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mimeType: 'image/gif', category: 'image', extension: 'gif' },
  { signature: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp', category: 'image', extension: 'webp' },
  { signature: [0x42, 0x4D], mimeType: 'image/bmp', category: 'image', extension: 'bmp' },
  { signature: [0x3C, 0x73, 0x76, 0x67], mimeType: 'image/svg+xml', category: 'image', extension: 'svg' },
  { signature: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], mimeType: 'image/svg+xml', category: 'image', extension: 'svg' },

  // Audio
  { signature: [0x49, 0x44, 0x33], mimeType: 'audio/mpeg', category: 'audio', extension: 'mp3' },
  { signature: [0xFF, 0xFB], mimeType: 'audio/mpeg', category: 'audio', extension: 'mp3' },
  { signature: [0xFF, 0xF3], mimeType: 'audio/mpeg', category: 'audio', extension: 'mp3' },
  { signature: [0xFF, 0xF2], mimeType: 'audio/mpeg', category: 'audio', extension: 'mp3' },
  { signature: [0x52, 0x49, 0x46, 0x46], mimeType: 'audio/wav', category: 'audio', extension: 'wav', offset: 0 },
  { signature: [0x4F, 0x67, 0x67, 0x53], mimeType: 'audio/ogg', category: 'audio', extension: 'ogg' },
  { signature: [0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41], mimeType: 'audio/m4a', category: 'audio', extension: 'm4a', offset: 4 },
  { signature: [0x66, 0x4C, 0x61, 0x43], mimeType: 'audio/flac', category: 'audio', extension: 'flac' },
  { signature: [0xFF, 0xF1], mimeType: 'audio/aac', category: 'audio', extension: 'aac' },
  { signature: [0xFF, 0xF9], mimeType: 'audio/aac', category: 'audio', extension: 'aac' },

  // PDF
  { signature: [0x25, 0x50, 0x44, 0x46], mimeType: 'application/pdf', category: 'pdf', extension: 'pdf' },

  // Microsoft Word Documents
  { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], mimeType: 'application/msword', category: 'document', extension: 'doc' },
  { signature: [0x50, 0x4B, 0x03, 0x04], mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', extension: 'docx' },
  { signature: [0x50, 0x4B, 0x05, 0x06], mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', extension: 'docx' },
  { signature: [0x50, 0x4B, 0x07, 0x08], mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', extension: 'docx' },
];

/**
 * Category to MIME Type mapping for validation
 */
export const MIME_TYPE_MAP = {
  image: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/bmp", "image/svg+xml"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/flac", "audio/aac"],
  pdf: ["application/pdf"],
  document: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
};

/**
 * Category to ID mapping for internal processing
 */
export const CATEGORY_IDS = {
  image: -1,
  audio: -2,
  pdf: -3,
  document: -4
};

export interface FileTypeDetectionResult {
  detectedMimeType: string;
  detectedCategory: string;
  detectedExtension: string;
  categoryId: number;
  isValid: boolean;
  securityRisk: boolean;
  originalFilename?: string;
  userProvidedMimeType?: string;
  mismatchDetails?: {
    expectedCategory: string;
    actualCategory: string;
    reason: string;
  };
}

/**
 * Advanced file type detection using magic numbers
 * 
 * @param buffer - File buffer to analyze
 * @param originalFilename - Original filename (for comparison)
 * @param userProvidedMimeType - User-provided MIME type (for comparison)
 * @returns Detailed analysis of the file type
 */
export function detectFileType(
  buffer: Buffer, 
  originalFilename?: string, 
  userProvidedMimeType?: string
): FileTypeDetectionResult {
  
  // Extract first 64 bytes for magic number analysis
  const headerBytes = buffer.slice(0, 64);
  
  let detectedSignature: MagicNumberSignature | null = null;
  
  // Check against all known signatures
  for (const signature of MAGIC_SIGNATURES) {
    const offset = signature.offset || 0;
    let matches = true;
    
    // Check if buffer has enough bytes
    if (headerBytes.length < offset + signature.signature.length) {
      continue;
    }
    
    // Compare signature bytes
    for (let i = 0; i < signature.signature.length; i++) {
      const bufferByte = headerBytes[offset + i];
      const signatureByte = signature.signature[i];
      
      // Apply mask if provided
      if (signature.mask && signature.mask[i] !== undefined) {
        if ((bufferByte & signature.mask[i]) !== (signatureByte & signature.mask[i])) {
          matches = false;
          break;
        }
      } else {
        if (bufferByte !== signatureByte) {
          matches = false;
          break;
        }
      }
    }
    
    if (matches) {
      detectedSignature = signature;
      break;
    }
  }
  
  // If no signature detected, file type is unknown/unsupported
  if (!detectedSignature) {
    return {
      detectedMimeType: 'application/octet-stream',
      detectedCategory: 'unknown',
      detectedExtension: 'bin',
      categoryId: 0,
      isValid: false,
      securityRisk: true,
      originalFilename,
      userProvidedMimeType,
      mismatchDetails: {
        expectedCategory: 'unknown',
        actualCategory: 'unknown',
        reason: 'No matching magic number signature found'
      }
    };
  }
  
  // Get category ID
  const categoryId = CATEGORY_IDS[detectedSignature.category as keyof typeof CATEGORY_IDS] || 0;
  
  // Check for security risks (mismatches)
  const securityRisk = checkSecurityRisk(detectedSignature, originalFilename, userProvidedMimeType);
  
  let mismatchDetails;
  if (securityRisk) {
    mismatchDetails = generateMismatchDetails(detectedSignature, originalFilename, userProvidedMimeType);
  }
  
  return {
    detectedMimeType: detectedSignature.mimeType,
    detectedCategory: detectedSignature.category,
    detectedExtension: detectedSignature.extension,
    categoryId,
    isValid: !securityRisk,
    securityRisk,
    originalFilename,
    userProvidedMimeType,
    mismatchDetails
  };
}

/**
 * Check if there's a security risk based on filename/MIME type mismatch
 */
function checkSecurityRisk(
  detectedSignature: MagicNumberSignature, 
  originalFilename?: string, 
  userProvidedMimeType?: string
): boolean {
  
  if (!originalFilename && !userProvidedMimeType) {
    return false; // No comparison data available
  }
  
  // Check filename extension mismatch
  if (originalFilename) {
    const fileExtension = originalFilename.split('.').pop()?.toLowerCase();
    if (fileExtension && fileExtension !== detectedSignature.extension) {
      // Allow some common extensions that might be valid
      const allowedAliases: Record<string, string[]> = {
        'jpg': ['jpeg', 'jpe'],
        'jpeg': ['jpg', 'jpe'],
        'htm': ['html'],
        'html': ['htm']
      };
      
      const aliases = allowedAliases[detectedSignature.extension] || [];
      if (!aliases.includes(fileExtension)) {
        return true;
      }
    }
  }
  
  // Check MIME type mismatch
  if (userProvidedMimeType && userProvidedMimeType !== detectedSignature.mimeType) {
    // Check if it's in the same category
    const detectedCategory = detectedSignature.category;
    const allowedMimeTypes = MIME_TYPE_MAP[detectedCategory as keyof typeof MIME_TYPE_MAP] || [];
    
    if (!allowedMimeTypes.includes(userProvidedMimeType)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate detailed mismatch information
 */
function generateMismatchDetails(
  detectedSignature: MagicNumberSignature, 
  originalFilename?: string, 
  userProvidedMimeType?: string
): { expectedCategory: string; actualCategory: string; reason: string } {
  
  let reason = '';
  
  if (originalFilename) {
    const fileExtension = originalFilename.split('.').pop()?.toLowerCase();
    if (fileExtension && fileExtension !== detectedSignature.extension) {
      reason += `Filename suggests '${fileExtension}' but magic number indicates '${detectedSignature.extension}'. `;
    }
  }
  
  if (userProvidedMimeType && userProvidedMimeType !== detectedSignature.mimeType) {
    reason += `User-provided MIME type '${userProvidedMimeType}' doesn't match detected type '${detectedSignature.mimeType}'. `;
  }
  
  return {
    expectedCategory: 'as_claimed',
    actualCategory: detectedSignature.category,
    reason: reason.trim()
  };
}

/**
 * Validate file against allowed categories
 */
export function validateFileCategory(
  detectionResult: FileTypeDetectionResult, 
  allowedCategories: string[]
): boolean {
  return allowedCategories.includes(detectionResult.detectedCategory);
}

/**
 * Get the actual file type ID based on detection (for the scenario in the prompt)
 */
export function getActualFileTypeId(detectionResult: FileTypeDetectionResult): number {
  return detectionResult.categoryId;
}

/**
 * Example usage for the scenario in the prompt
 */
export function processScenarioFile(buffer: Buffer, filename: string): {
  filename: string;
  claimedType: string;
  actualType: string;
  actualCategory: string;
  actualId: number;
  securityRisk: boolean;
} {
  
  const detectionResult = detectFileType(buffer, filename);
  
  return {
    filename,
    claimedType: 'PDF (based on filename)',
    actualType: detectionResult.detectedMimeType,
    actualCategory: detectionResult.detectedCategory, 
    actualId: detectionResult.categoryId,
    securityRisk: detectionResult.securityRisk
  };
}
