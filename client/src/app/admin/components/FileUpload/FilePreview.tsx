// app/admin/components/FileUpload/FilePreview.tsx


// showing individual items in file 
import React from "react";

interface FilePreviewProps {
  file: File;
  index: number;
  onSelect: (file: File) => void;
  onRemove: (index: number) => void;
}

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("audio/")) return "🎵";
  if (type === "application/pdf") return "📕";
  if (type.includes("word")) return "📝";
  // if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  // if (type.includes("powerpoint") || type.includes("presentation")) return "📈";
  if (type === "text/plain") return "📜";
  return "📄";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const FilePreview: React.FC<FilePreviewProps> = ({ file, index, onSelect, onRemove }) => (
  <div
    onClick={() => onSelect(file)}
    className="group p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-gray-600 text-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-all duration-300 hover:shadow-lg"
  >
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
        <span className="text-2xl">{getFileIcon(file)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-white group-hover:text-blue-300 transition-colors duration-200">
          {file.name}
        </p>
        <div className="flex items-center space-x-3 mt-1">
          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
          <span className="text-gray-600">•</span>
          <p className="text-xs text-gray-400 capitalize">
            {file.type.split('/')[1] || file.type}
          </p>
        </div>
      </div>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(index);
      }}
      className="ml-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group-hover:opacity-100 opacity-0"
      title="Remove file"
    >
      <span className="text-lg">×</span>
    </button>
  </div>
);

export default FilePreview;