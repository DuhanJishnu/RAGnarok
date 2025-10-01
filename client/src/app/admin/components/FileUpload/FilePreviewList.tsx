// app/admin/components/FileUpload/FilePreviewList.tsx
import React from "react";
import FilePreview from "./FilePreview";

interface FilePreviewListProps {
  files: File[];
  visibleCount: number;
  setVisibleCount: (n: number) => void;
  setSelectedFile: (file: File | null) => void;
  removeFile: (index: number) => void;
}

const FilePreviewList: React.FC<FilePreviewListProps> = ({
  files,
  visibleCount,
  setVisibleCount,
  setSelectedFile,
  removeFile,
}) => {
  if (files.length === 0) return null;

  const toggleMore = () => {
    if (visibleCount >= files.length) setVisibleCount(3);
    else setVisibleCount(visibleCount + 3);
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Selected Files ({files.length})
        </h3>
      </div>
      {/*select the required files and show them to down the tab  */}
      {files.slice(0, visibleCount).map((file, idx) => (
        <FilePreview
          key={idx}
          file={file}
          index={idx}
          onSelect={setSelectedFile}
          onRemove={removeFile}
        />
      ))}
      
      {files.length > 3 && (
        <div className="text-center pt-2">
          <button
            className="px-6 py-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all duration-200 font-medium"
            onClick={toggleMore}
          >
            {visibleCount >= files.length 
              ? "Show Less" 
              : `Show ${Math.min(3, files.length - visibleCount)} More`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilePreviewList;