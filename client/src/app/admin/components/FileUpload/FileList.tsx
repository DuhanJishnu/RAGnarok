// app/admin/components/FileUpload/FileList.tsx
import React from "react";
import type { UploadedFile } from "../../hooks/useFileUpload";

interface FileListProps {
  files: UploadedFile[];
  loading: boolean;
  error: string;
  onFileSelect?: (file: UploadedFile) => void;
  fileTypeFilter?: string; 
  filteredCount?: number;
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return "Unknown size";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) {
    return "🖼️";
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext || '')) {
    return "🎵";
  }
  if (ext === 'pdf') return "📕";
  if (['doc', 'docx'].includes(ext || '')) return "📝";
  if (ext === 'txt') return "📜";
  return "📄";
};

const FileList: React.FC<FileListProps> = ({ files, loading, error, onFileSelect,fileTypeFilter,filteredCount }) => {
  if (loading) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-300">Loading files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center">
        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="mt-6 p-6 rounded-2xl bg-gray-800/50 border border-gray-700 text-center">
        <div className="text-4xl mb-3">📁</div>
        <p className="text-gray-300 text-lg">No files uploaded yet</p>
        <p className="text-gray-500">Upload some files to see them here</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        Uploaded Files <span className="ml-2 text-gray-400">
            ({filteredCount !== undefined ? filteredCount : files.length})
            {fileTypeFilter && fileTypeFilter !== 'all' && (
              <span className="text-sm text-blue-400 ml-1">• {fileTypeFilter}</span>
            )}
          </span>
      </h3>
      
      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={index}
            className="group p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-gray-600 text-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-all duration-300"
            onClick={() => onFileSelect?.(file)}
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-2xl">{getFileIcon(file.filename)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-white group-hover:text-green-300 transition-colors duration-200">
                  {file.filename}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-xs text-gray-400">
                    {file.size ? formatFileSize(file.size) : "Unknown size"}
                  </p>
                  <span className="text-gray-600">•</span>
                  <p className="text-xs text-gray-400">
                    {file.path.split('/').pop()?.split('.').pop()?.toUpperCase() || "File"}
                  </p>
                </div>
              </div>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${file.path}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-4 p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Download file"
            >
              <span className="text-lg">⬇️</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;