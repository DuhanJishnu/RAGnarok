import { useState, useEffect } from "react";
import api from '../services/api';

export type UploadedFile = {
  name: string;
  link: string;
  thumb?: string;
  fileType?: number;
};

export const useFileUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // selected file to show them before sending
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isDragging, setIsDragging] = useState(false);


  // filetype image -1, audio  -2 pdfs -3 , word doc -4 
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES: string[] = [
    "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp", "image/svg+xml",
    "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/flac", "audio/aac",
    "text/plain", "application/pdf", 
    "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
//function to validate file on allowed type and return valid(file) and reject(file,reason) file array
  const validateFiles = (fileList: FileList) => {
    const validFiles: File[] = [];
    const rejectedFiles: { file: File; reason: string }[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
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
    const res = await api.post<{ files: UploadedFile[] }>(
      `/api/file/v1/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 300000 }
    );
    setUploadedFiles(res.data.files);
    setFiles([]);
    setSelectedFile(null);
  } catch (err: any) {
    setError(err.response?.data?.message || "Upload failed. Try again!");
  } finally {
    setLoading(false);
  }
};

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
  };
};
