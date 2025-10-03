// app/admin/components/FileUpload/Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  loading = false
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="text-sm text-gray-400">
        Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev || loading}
          className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
            !hasPrev || loading
              ? "border-gray-700 text-gray-600 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
          }`}
        >
          Previous
        </button>
        
        {/* Page numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                currentPage === pageNum
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border border-gray-600 text-gray-300 hover:bg-gray-700"
              } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext || loading}
          className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
            !hasNext || loading
              ? "border-gray-700 text-gray-600 cursor-not-allowed"
              : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;