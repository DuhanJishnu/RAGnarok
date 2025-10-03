// app/admin/components/FileUpload/FilterDropdown.tsx
import React from "react";

export type FileTypeFilter = 'all' | 'image' | 'audio' | 'pdf' | 'doc';

interface FilterDropdownProps {
  currentFilter: FileTypeFilter;
  onFilterChange: (filter: FileTypeFilter) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
  currentFilter, 
  onFilterChange 
}) => {
  const filterOptions: { value: FileTypeFilter; label: string; icon: string }[] = [
    { value: 'all', label: 'All Files', icon: '📁' },
    { value: 'image', label: 'Images', icon: '🖼️' },
    { value: 'audio', label: 'Audio', icon: '🎵' },
    { value: 'pdf', label: 'PDFs', icon: '📕' },
    { value: 'doc', label: 'Documents', icon: '📝' },
  ];

  const getCurrentFilterIcon = () => {
    const current = filterOptions.find(opt => opt.value === currentFilter);
    return current?.icon || '📁';
  };

  const getCurrentFilterLabel = () => {
    const current = filterOptions.find(opt => opt.value === currentFilter);
    return current?.label || 'All Files';
  };

  return (
    <div className="relative inline-block">
      <button
        className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 flex items-center space-x-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span>{getCurrentFilterIcon()}</span>
        <span>{getCurrentFilterLabel()}</span>
        <span className="text-gray-400">▼</span>
      </button>
      
      <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-all duration-200 ${
              currentFilter === option.value
                ? 'bg-blue-500/20 text-blue-300 border-r-2 border-blue-500'
                : 'text-gray-300 hover:bg-gray-700/50'
            } first:rounded-t-xl last:rounded-b-xl`}
          >
            <span className="text-lg">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterDropdown;