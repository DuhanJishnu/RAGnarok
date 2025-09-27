import { prisma } from "../config/prisma";


/**
 * Inserts a new document record into the Documents table.
 * 
 * @param {number} docType - Tinyint representing the document type
 * @param {string} displayName - The name to display
 * @param {string} encryptedId - The encrypted identifier
 * @param {number} originalSize - Original file size in MB/KB (float)
 * @param {string} fileExt - File extension (e.g., "pdf", "jpg")
 */
export async function insertInitialDocumentData(docType, displayName, encryptedId, originalSize, fileExt) {
  try {
    const document = await prisma.document.create({
      data: {
        documentType: docType,
        displayName: displayName,
        documentEncryptedId: encryptedId,
        originalFileSize: originalSize,
        fileExtension: fileExt,
        isProcessed: false,
      },
    });
    
    return document.id;
  } catch (err) {
    console.error('Error inserting initial document data:', err.message);
    throw err;
  }
}


/**
 * Updates a document record with processing results.
 * 
 * @param {number} documentId - The ID of the document to update
 * @param {string} documentPath - Final path of the processed document
 * @param {number} currentFileSize - The compressed/current file size
 * @param {boolean|number} isProcessed - Whether the document was processed (0 or 1)
 * @param {Date|string} processedDateTime - Timestamp of processing (can be JS Date or MySQL datetime string)
 */
export async function updateDocumentStatus(documentId, documentPath, currentFileSize, isProcessed, processedDateTime, thumbFilePath) {
  try {
    // 🧪 Validate inputs
    if (typeof currentFileSize !== 'number') {
      const parsed = parseFloat(currentFileSize);
      if (isNaN(parsed)) {
        throw new Error(`Invalid file size: ${JSON.stringify(currentFileSize)}`);
      }
      currentFileSize = parsed;
    }

    if (typeof isProcessed !== 'boolean') {
      if (typeof isProcessed === 'number') {
        isProcessed = isProcessed === 1;
      } else {
        const parsed = parseInt(isProcessed);
        if (isNaN(parsed)) {
          throw new Error(`Invalid isProcessed: ${JSON.stringify(isProcessed)}`);
        }
        isProcessed = parsed === 1;
      }
    }

    if (!(processedDateTime instanceof Date)) {
      processedDateTime = new Date(processedDateTime);
      if (isNaN(processedDateTime.getTime())) {
        throw new Error(`Invalid processedDateTime: ${JSON.stringify(processedDateTime)}`);
      }
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        documentPath: documentPath,
        currentFileSize: currentFileSize,
        isProcessed: isProcessed,
        processedDateTime: processedDateTime,
        thumbPath: thumbFilePath,
      },
    });

    return updatedDocument;
  } catch (err) {
    console.error('Error updating document:', err.message);
    throw err;
  }
}


/* 
 * Finds the Path of file from its encrypted ID
 * 
 * returns -1 for file not present
 * returns -2 for file not processed 
 * returns -3 for error while finding file
 * 
 * @param {string} encryptedId - encrypted id of document
 * */
export async function getFilePath(encryptedId) {
  try {
    // Check the encryptedId does not have any special characters which can cause issues
    if (typeof encryptedId !== 'string' || /[^a-zA-Z0-9_]/.test(encryptedId)) {
      return -3;
    }

    const document = await prisma.document.findUnique({
      where: { documentEncryptedId: encryptedId },
      select: { documentPath: true, isProcessed: true },
    });

    if (!document) {
      return -1;
    }

    // Return the file path if the document is processed, otherwise return -2
    if (document.isProcessed) {
      return document.documentPath;
    } else {
      return -2;
    }
  } catch (err) {
    console.error('Error finding document path:', err.message);
    return -3;
  }
}

/* 
 * Finds the Path of thumb file from its encrypted ID
 * 
 * returns -1 for file not present
 * returns -2 for file not processed 
 * returns -3 for error while finding file
 * 
 * @param {string} encryptedId - encrypted id of document
 * */
export async function getThumbFilePath(encryptedId) {
  try {
    // Check the encryptedId does not have any special characters which can cause issues
    if (typeof encryptedId !== 'string' || /[^a-zA-Z0-9_]/.test(encryptedId)) {
      return -3;
    }

    const document = await prisma.document.findUnique({
      where: { documentEncryptedId: encryptedId },
      select: { thumbPath: true, isProcessed: true },
    });

    if (!document) {
      return -1;
    }

    // Return the thumb path if the document is processed, otherwise return -2
    if (document.isProcessed) {
      return document.thumbPath;
    } else {
      return -2;
    }
  } catch (err) {
    console.error('Error finding thumb path:', err.message);
    return -3;
  }
}


export async function deleteDocumentById(documentId) {
  try {
    if (typeof documentId !== 'number' || isNaN(documentId)) {
      throw new Error(`Invalid documentId: ${JSON.stringify(documentId)}`);
    }

    const deletedDocument = await prisma.document.delete({
      where: { id: documentId },
    });

    return deletedDocument;
  } catch (err) {
    console.error('Error deleting document:', err.message);
    throw err;
  }
}

