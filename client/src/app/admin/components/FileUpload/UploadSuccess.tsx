// app/admin/components/FileUpload/UploadSuccess.tsx
import React from "react";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
import type { UploadedFile } from "../../../admin/hooks/useFileUpload";

interface UploadSuccessProps {
  uploadedFiles: UploadedFile[];
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadSuccess: React.FC<UploadSuccessProps> = ({ uploadedFiles }) => {
  if (uploadedFiles.length === 0) return null;

  return (
    <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-lg">✓</span>
        </div>
        <div>
          <p className="font-semibold text-green-300 text-lg">Upload Successful!</p>
          <p className="text-green-400/70 text-sm">{uploadedFiles.length} files uploaded</p>
        </div>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {uploadedFiles.map((file, idx) => (
          <a
            key={idx}
            href={`${backendUrl}${file.path}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-green-400 text-lg">📄</span>
              <span className="text-green-300 truncate group-hover:text-green-200 transition-colors duration-200">
                {file.filename}
              </span>
            </div>
            <span className="text-green-400/70 text-sm ml-2">
              {file.size ? formatFileSize(file.size) : ""}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default UploadSuccess;