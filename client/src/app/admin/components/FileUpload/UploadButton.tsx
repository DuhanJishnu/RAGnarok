// app/admin/components/FileUpload/UploadButton.tsx
import React from "react";

interface UploadButtonProps {
  files: File[];
  loading: boolean;
  onUpload: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ files, loading, onUpload }) => (
  <button
    onClick={onUpload}
    disabled={loading || files.length === 0}
    className={`w-full mt-6 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] ${
      loading || files.length === 0
        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl"
    }`}
  >
    {loading ? (
      <div className="flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
        Uploading {files.length} file{files.length > 1 ? 's' : ''}...
      </div>
    ) : files.length > 0 ? (
      `Upload ${files.length} File${files.length > 1 ? 's' : ''}`
    ) : (
      "Select Files to Upload"
    )}
  </button>
);

export default UploadButton;