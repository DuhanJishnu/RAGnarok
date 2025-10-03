// app/admin/components/FileUpload/SearchBar.tsx
import React, { useState, useCallback } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  loading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchQuery, loading = false }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
  }, [localQuery, onSearch]);

  const handleClear = () => {
    setLocalQuery("");
    onSearch("");
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search files by name..."
            className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            disabled={loading}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            🔍
          </div>
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
              disabled={loading}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-500">
            {searchQuery && `Searching for: "${searchQuery}"`}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;