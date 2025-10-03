import { useState, useEffect } from "react";
import api from '../services/api';
export type UploadedFile = {
  name: string;
  link: string;
  thumb?: string;
  fileType?: number;
  id?: number;
  documentEncryptedId?: string;
};

export type FileWithThumbState = UploadedFile & {
  thumbLoading?: boolean;
  thumbError?: boolean;
  retryCount?: number;
};

// 1
export type PaginatedFiles = {
  files: UploadedFile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};


export type FileTypeFilter = 'all' | 'image' | 'audio' | 'pdf' | 'doc'; 
export const useFileUpload = () => {

  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithThumbState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // selected file to show them before sending
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
// 2
 const [paginatedFiles, setPaginatedFiles] = useState<PaginatedFiles>({
    files: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState("");

const [fileFilterType, setFileFilterType] = useState<FileTypeFilter>('all');
const [searchQuery, setSearchQuery] = useState("");
const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  // filetype image -1, audio  -2 pdfs -3 , word doc -4 
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES: string[] = [
    "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp", "image/svg+xml",
    "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/flac", "audio/aac", "audio/mp4",
    "text/plain", "application/pdf", 
    "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  // Function to check if thumbnail is available
  const checkThumbnailAvailability = async (thumbUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(thumbUrl, { method: 'HEAD' });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };

  // Function to get fallback icon based on file type
  const getFallbackIcon = (fileType?: number, fileName?: string): string => {
    // Determine file type if not provided
    if (!fileType && fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      switch (extension) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'webp':
        case 'bmp':
        case 'svg':
          fileType = 1;
          break;
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'm4a':
        case 'flac':
        case 'aac':
          fileType = 2;
          break;
        case 'pdf':
          fileType = 3;
          break;
        case 'doc':
        case 'docx':
          fileType = 4;
          break;
        default:
          fileType = 1;
      }
    }

    // Return appropriate icon based on file type
    switch (fileType) {
      case 1: // Image
        return '🖼️';
      case 2: // Audio
        return '🎵';
      case 3: // PDF
        return '📄';
      case 4: // Word Document
        return '📝';
      default:
        return '📄';
    }
  };

  // Function to retry thumbnail loading with intervals
  const retryThumbnailLoading = async (fileIndex: number, thumbUrl: string, maxRetries: number = 5) => {
    let retryCount = 0;
    
    const tryLoadThumbnail = async (): Promise<void> => {
      const isAvailable = await checkThumbnailAvailability(thumbUrl);
      
      if (isAvailable) {
        // Thumbnail is available, update the file state
        setUploadedFiles(prev => prev.map((file, index) => 
          index === fileIndex 
            ? { ...file, thumbLoading: false, thumbError: false }
            : file
        ));
        return;
      }
      
      retryCount++;
      
      if (retryCount >= maxRetries) {
        // Max retries reached, show error state
        setUploadedFiles(prev => prev.map((file, index) => 
          index === fileIndex 
            ? { ...file, thumbLoading: false, thumbError: true, retryCount }
            : file
        ));
        return;
      }
      
      // Update retry count and continue
      setUploadedFiles(prev => prev.map((file, index) => 
        index === fileIndex 
          ? { ...file, retryCount }
          : file
      ));
      
      // Wait 500ms before next retry
      setTimeout(tryLoadThumbnail, 500);
    };
    
    tryLoadThumbnail();
  };
//function to validate file on allowed type and return valid(file) and reject(file,reason) file array
  const validateFiles = (fileList: FileList) => {
    const validFiles: File[] = [];
    const rejectedFiles: { file: File; reason: string }[] = [];

    Array.from(fileList).forEach((file) => {
      const isAllowed = ALLOWED_TYPES.includes(file.type) || 
                        (file.type.includes('/x-') && ALLOWED_TYPES.includes(file.type.replace('/x-', '/')));

      if (!isAllowed) {
        console.log(`Rejected file: ${file.name}, MIME type: ${file.type}`);
        rejectedFiles.push({ file, reason: "Unsupported file type" });
      } else if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push({ file, reason: "File too large (max 100MB)" });
      } else {
        validFiles.push(file);
      }
    });

    return { validFiles, rejectedFiles };
  };
//function to validate file that is added from system and add to files array 
  const addFiles = (fileList: FileList) => {
    const { validFiles, rejectedFiles } = validateFiles(fileList);
    if (rejectedFiles.length > 0) {
      const rejectedNames = rejectedFiles.map(({ file, reason }) => `${file.name} (${reason})`);
      setError(`${rejectedFiles.length} file(s) rejected: ${rejectedNames.join(", ")}`);
    } else {
      setError("");
    }
    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setUploadedFiles([]);
    }
  };
//function to remove from showing in preview
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedFile && files[index] === selectedFile) {
      setSelectedFile(null);
    }
  };
//to clear all items
  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
    setError("");
  };

  const handleUpload = async () => {
  if (files.length === 0) return setError("Please select files first");
  const formData = new FormData();
    // Create array to store file types in same order as files
  const fileTypes: number[] = [];
  // First, append all files and collect their types
  files.forEach((file) => {
    formData.append("files", file); // This stays the same
    
    // Determine file type integer
    let fileType = 1; // default to image
    
    if (file.type.startsWith("image/")) {
      fileType = 1;
    } else if (file.type.startsWith("audio/")) {
      fileType = 2;
    } else if (file.type === "application/pdf") {
      fileType = 3;
    } else if (file.type.includes("word") || 
               file.type === "application/msword" ||
               file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      fileType = 4;
    }
    
    fileTypes.push(fileType); // Store type in array
  });
 // Append fileTypes as a JSON string array
  formData.append("fileTypes", JSON.stringify(fileTypes));
  try {
    setLoading(true);
    setError("");
    const res = await api.post<{ 
      files: UploadedFile[];
      securityInfo?: {
        totalFiles: number;
        validatedFiles: number;
        rejectedFiles: number;
        securityRisksDetected: boolean;
      }
    }>(
      `/api/file/v1/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 300000 },
    );
    
    // Initialize uploaded files with loading state for thumbnails
    const filesWithThumbState: FileWithThumbState[] = res.data.files.map(file => ({
      ...file,
      thumbLoading: file.thumb ? true : false,
      thumbError: false,
      retryCount: 0
    }));
    
    setUploadedFiles(filesWithThumbState);
    
    // Start thumbnail loading process for files that have thumb URLs
    filesWithThumbState.forEach((file, index) => {
      if (file.thumb) {
        retryThumbnailLoading(index, file.thumb);
      }
    });
    
    // Log security information if available
    if (res.data.securityInfo) {
      if (res.data.securityInfo.securityRisksDetected) {
        console.warn('⚠️ Security risks detected during file upload validation');
      }
    }
    setFiles([]);
    setSelectedFile(null);
  } catch (err: any) {
    setError(err.response?.data?.message || "Upload failed. Try again!");
  } finally {
    setLoading(false);
  }
};


// 3
  const fetchFiles = async (page: number = 1, limit: number = 10) => {
    try {
      setFilesLoading(true);
      setFilesError("");
      const getFileTypeNumber = (filter: FileTypeFilter): number => {
  switch (filter) {
    case 'all': return 0;
    case 'image': return 1;
    case 'audio': return 2;
    case 'pdf': return 3;
    case 'doc': return 4;
    default: return 0;
  }
};
      
 const res = await api.post<{
      result: {
        pageNo: number;
        pageSize: number;
        totalPages: number;
        totalCount: number;
        documents: {
          id: number;
          displayName: string;
          documentEncryptedId: string;
          documentType: number;
          thumbPath: string | null;
          documentPath: string | null;
        }[]
      };
    }>(
      `/api/file/v1/fetchdocuments`,
      {
        pageNo: page.toString(),
        docType: getFileTypeNumber(fileFilterType).toString(),
      }
    );

       const { pageNo, pageSize, totalPages, totalCount, documents } = res.data?.result;
        const mappedFiles: UploadedFile[] = documents.map((doc) => ({
      name: doc.displayName,
      link: doc.documentPath || "",   // fallback to empty string
      thumb: doc.thumbPath || undefined,
      fileType: doc.documentType,
      id: doc.id,
      documentEncryptedId: doc.documentEncryptedId
    }));

     setPaginatedFiles({
      files: mappedFiles,
      totalCount,
      currentPage: pageNo,
      totalPages,
      hasNext: pageNo < totalPages,
      hasPrev: pageNo > 1,
    });



    } catch (err: any) {
      setFilesError(err.response?.data?.error || "Failed to fetch files");
    } finally {
      setFilesLoading(false);
    }
  };


  const searchFiles = async (query: string, page: number = 1) => {
  try {
    setFilesLoading(true);
    setFilesError("");
    setSearchQuery(query);

    const getFileTypeNumber = (filter: FileTypeFilter): number => {
      switch (filter) {
        case 'all': return 0;
        case 'image': return 1;
        case 'audio': return 2;
        case 'pdf': return 3;
        case 'doc': return 4;
        default: return 0;
      }
    };

    const res = await api.post<{
      pageNo: number;
      pageSize: number;
      totalPages: number;
      totalCount: number;
      documents: {
        id: number;
        displayName: string;
        documentEncryptedId: string;
        documentType: number;
        thumbPath: string | null;
        documentPath: string | null;
      }[];
    }>(
      `/api/file/v1/fetchdocumentsbyName`,
      {
        pageNo: page.toString(),
        docType: getFileTypeNumber(fileFilterType).toString(),
        search: query // Add search parameter
      }
    );

    const { pageNo, pageSize, totalPages, totalCount, documents } = res.data;
    const mappedFiles: UploadedFile[] = documents.map((doc) => ({
      name: doc.displayName,
      link: doc.documentPath || "",
      thumb: doc.thumbPath || undefined,
      fileType: doc.documentType,
       id: doc.id,
      documentEncryptedId: doc.documentEncryptedId
    }));

    setPaginatedFiles({
      files: mappedFiles,
      totalCount,
      currentPage: pageNo,
      totalPages,
      hasNext: pageNo < totalPages,
      hasPrev: pageNo > 1,
    });

  } catch (err: any) {
    setFilesError(err.response?.data?.error || "Failed to search files");
  } finally {
    setFilesLoading(false);
  }
};

const deleteFile = async (fileId: number, documentEncryptedId: string) => {
   if (!documentEncryptedId) {
    setFilesError("Cannot delete file: Missing file identifier");
    return;
  }
  try {
    setDeleteLoading(fileId);
    
    await api.delete(`/api/file/v1/delete`, {
  data: {
    id: documentEncryptedId
  }
});


    // Refresh the file list after successful deletion
    if (searchQuery) {
      await searchFiles(searchQuery, paginatedFiles.currentPage);
    } else {
      await fetchFiles(paginatedFiles.currentPage);
    }

  } catch (err: any) {
    setFilesError(err.response?.data?.error || "Failed to delete file");
  } finally {
    setDeleteLoading(null);
  }
};

useEffect(() => {
    fetchFiles(1);
    
  }, [fileFilterType]);

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.name));
  }, [files]);

  return {
    files,
    uploadedFiles,
    loading,
    error,
    selectedFile,
    setSelectedFile,
    visibleCount,
    setVisibleCount,
    isDragging,
    setIsDragging,
    addFiles,
    removeFile,
    clearAllFiles,
    handleUpload,
    getFallbackIcon,
    paginatedFiles,
    filesLoading,
    filesError,
    fetchFiles,
    fileFilterType,
    setFileFilterType,
    searchFiles,
  deleteFile,
  searchQuery,
  setSearchQuery,
  deleteLoading,
  };
};
