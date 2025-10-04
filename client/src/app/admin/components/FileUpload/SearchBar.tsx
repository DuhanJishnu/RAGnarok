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
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              🔍
            </div>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search files by name..."
              className="w-full px-4 py-3 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              disabled={loading}
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                disabled={loading}
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Search Button */}
          <button
            type="submit"
            disabled={loading || !localQuery.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium whitespace-nowrap min-w-[120px]"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        
        {/* Search Query Display */}
        {searchQuery && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-gray-500">
              Searching for: "<span className="text-gray-300">{searchQuery}</span>"
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
              disabled={loading}
            >
              Clear search
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;