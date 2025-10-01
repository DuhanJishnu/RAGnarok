// app/admin/components/FileUpload/FileDropzone.tsx
import React, { DragEvent, ChangeEvent } from "react";

interface FileDropzoneProps {
  addFiles: (files: FileList) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ addFiles, isDragging, setIsDragging }) => {
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = ""; // reset input
  };

  return (
    <label
      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
        isDragging 
          ? "border-blue-400 bg-blue-500/10 scale-[1.02] shadow-lg" 
          : "border-gray-600 hover:border-blue-400 hover:bg-gray-800/50"
      } group`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
    >
      <div className="text-center p-6 transition-all duration-300 group-hover:scale-105">
        <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">
          {isDragging ? "🎉" : "📁"}
        </div>
        <span className="text-lg font-medium text-gray-300 block mb-1">
          {isDragging ? "Drop files here!" : "Drag & drop files"}
        </span>
        <span className="text-sm text-gray-500">or click to browse</span>
        <div className="mt-2 text-xs text-gray-600">
          Supports images, audio, documents, and more
        </div>
      </div>
      <input type="file" className="hidden" multiple onChange={handleFileChange} />
    </label>
  );
};

export default FileDropzone;