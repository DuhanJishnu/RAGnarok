// app/admin/components/FileUpload/index.tsx
'use client'

import React from "react";
import FileDropzone from "./FileDropZone";
import FilePreviewList from "./FilePreviewList";
import FileViewer from "./FileViewer";
import UploadButton from "./UploadButton";
import UploadSuccess from "./UploadSuccess";
import  { useFileUpload } from "../../hooks/useFileUpload";

const FileUpload: React.FC = () => {
  const upload = useFileUpload();

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
              <span className="text-white text-lg">📂</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">File Upload</h2>
              <p className="text-gray-400 text-sm">Upload and manage your files</p>
            </div>
          </div>
          {upload.files.length > 0 && (
            <button 
              onClick={upload.clearAllFiles}
              className="px-4 py-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all duration-200 font-medium flex items-center"
            >
              <span className="mr-2">🗑️</span>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* if someone select file or drop file then add to addFiles */}
        <FileDropzone 
          addFiles={upload.addFiles} 
          isDragging={upload.isDragging} 
          setIsDragging={upload.setIsDragging} 
        />
        {/* if file is there then show them and generate a temp url for preview that will be revoked when file changes*/}
        <FilePreviewList {...upload} />

        {upload.selectedFile && (
          <FileViewer file={upload.selectedFile} onClose={() => upload.setSelectedFile(null)} />
        )}

        {upload.error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
            {upload.error}
          </div>
        )}

        <UploadButton files={upload.files} loading={upload.loading} onUpload={upload.handleUpload} />

        <UploadSuccess uploadedFiles={upload.uploadedFiles} />
      </div>
    </div>
  );
};

export default FileUpload;