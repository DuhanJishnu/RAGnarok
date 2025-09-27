'use client'

import React from "react";

import FileDropzone from "./FileDropZone";
import FilePreviewList from "./FilePreviewList";
import FileViewer from "./FileViewer";
import UploadButton from "./UploadButton";
import UploadSuccess from "./UploadSuccess";
import { useFileUpload } from "../../hooks/useFileUpload";

const FileUpload: React.FC = () => {
  const upload = useFileUpload();

  return (
    <div className="p-6 border border-gray-700 rounded-2xl bg-gray-900 shadow-lg max-w-2xl mx-auto text-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">📂 File Upload</h2>
        {upload.files.length > 0 && (
          <button onClick={upload.clearAllFiles} className="text-sm text-red-500 hover:text-red-400 underline">
            Clear All
          </button>
        )}
      </div>

      <FileDropzone addFiles={upload.addFiles} isDragging={upload.isDragging} setIsDragging={upload.setIsDragging} />

      <FilePreviewList {...upload} />
{/* if file is selected then show them in file Viewer */}
      {upload.selectedFile && <FileViewer file={upload.selectedFile} onClose={() => upload.setSelectedFile(null)} />}

      {upload.error && <div className="mt-3 p-3 bg-red-800 text-red-200 border border-red-700 rounded-lg">{upload.error}</div>}

      <UploadButton files={upload.files} loading={upload.loading} onUpload={upload.handleUpload} />

      <UploadSuccess uploadedFiles={upload.uploadedFiles} />
    </div>
  );
};

export default FileUpload;
