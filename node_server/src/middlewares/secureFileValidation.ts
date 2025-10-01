import { Request, Response, NextFunction } from 'express';
import { detectFileType, validateFileCategory, MIME_TYPE_MAP } from '../lib/magicNumberDetection';

/**
 * Enhanced file validation middleware using magic number detection
 * 
 * This middleware:
 * 1. Performs magic number analysis on uploaded files
 * 2. Compares detected type with user-provided information
 * 3. Rejects files with security risks (type mismatches)
 * 4. Updates file information with actual detected types
 */

interface SecureFileValidationOptions {
  allowedCategories?: string[];
  rejectOnMismatch?: boolean;
  logSuspiciousActivity?: boolean;
}

export const secureFileValidation = (options: SecureFileValidationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        allowedCategories = ['image', 'audio', 'pdf', 'document'],
        rejectOnMismatch = true,
        logSuspiciousActivity = true
      } = options;

      // Check if files exist
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return next();
      }

      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      const validatedFiles: Express.Multer.File[] = [];
      const rejectedFiles: Array<{
        filename: string;
        reason: string;
        securityRisk: boolean;
        detectedType: string;
        claimedType: string;
      }> = [];

      // Process each file
      for (const file of files) {
        if (!file.buffer) {
          rejectedFiles.push({
            filename: file.originalname,
            reason: 'File buffer is empty',
            securityRisk: false,
            detectedType: 'unknown',
            claimedType: file.mimetype || 'unknown'
          });
          continue;
        }

        // Perform magic number detection
        const detectionResult = detectFileType(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        // Log suspicious activity if enabled
        if (logSuspiciousActivity && detectionResult.securityRisk) {
          console.warn('🚨 SECURITY ALERT - File type mismatch detected:', {
            filename: file.originalname,
            userIP: req.ip,
            userAgent: req.get('User-Agent'),
            claimedMimeType: file.mimetype,
            detectedMimeType: detectionResult.detectedMimeType,
            detectedCategory: detectionResult.detectedCategory,
            mismatchDetails: detectionResult.mismatchDetails,
            timestamp: new Date().toISOString()
          });
        }

        // Check if file category is allowed
        if (!validateFileCategory(detectionResult, allowedCategories)) {
          rejectedFiles.push({
            filename: file.originalname,
            reason: `File type '${detectionResult.detectedCategory}' is not allowed. Allowed types: ${allowedCategories.join(', ')}`,
            securityRisk: detectionResult.securityRisk,
            detectedType: detectionResult.detectedMimeType,
            claimedType: file.mimetype || 'unknown'
          });
          continue;
        }

        // Handle security risks
        if (detectionResult.securityRisk && rejectOnMismatch) {
          rejectedFiles.push({
            filename: file.originalname,
            reason: `Security risk detected: ${detectionResult.mismatchDetails?.reason || 'File type mismatch'}`,
            securityRisk: true,
            detectedType: detectionResult.detectedMimeType,
            claimedType: file.mimetype || 'unknown'
          });
          continue;
        }

        // Update file object with detected information
        const enhancedFile = {
          ...file,
          // Override user-provided mimetype with detected type for security
          mimetype: detectionResult.detectedMimeType,
          // Add detection metadata
          detectionResult,
          // Add security flags
          isSecure: !detectionResult.securityRisk,
          actualCategory: detectionResult.detectedCategory,
          actualExtension: detectionResult.detectedExtension
        };

        validatedFiles.push(enhancedFile as any);
      }

      // If any files were rejected and we're in strict mode, reject the entire request
      if (rejectedFiles.length > 0 && rejectOnMismatch) {
        return res.status(400).json({
          error: 'File validation failed',
          message: 'One or more files failed security validation',
          rejectedFiles: rejectedFiles.map(rf => ({
            filename: rf.filename,
            reason: rf.reason,
            securityRisk: rf.securityRisk
          })),
          details: 'Files have been rejected due to type mismatches or security risks'
        });
      }

      // Attach validated files to request
      req.files = validatedFiles;
      
      // Add validation summary to request
      (req as any).fileValidation = {
        totalFiles: files.length,
        validatedFiles: validatedFiles.length,
        rejectedFiles: rejectedFiles.length,
        rejectionDetails: rejectedFiles,
        hasSecurityRisks: rejectedFiles.some(rf => rf.securityRisk)
      };

      next();
    } catch (error) {
      console.error('Error in secure file validation middleware:', error);
      return res.status(500).json({
        error: 'File validation failed',
        message: 'Internal error during file type detection'
      });
    }
  };
};

/**
 * Middleware specifically for the upload route with predefined security settings
 */
export const uploadFileValidation = secureFileValidation({
  allowedCategories: ['image', 'audio', 'pdf', 'document'],
  rejectOnMismatch: true,
  logSuspiciousActivity: true
});

/**
 * More permissive validation for development/testing
 */
export const lenientFileValidation = secureFileValidation({
  allowedCategories: ['image', 'audio', 'pdf', 'document'],
  rejectOnMismatch: false,
  logSuspiciousActivity: true
});
