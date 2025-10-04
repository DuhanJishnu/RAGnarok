// app/admin/users/page.tsx
'use client';

import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';

export default function UsersPage() {
  const { user, toggleUserRole, searchUserByEmail, loading, clearSearch } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (email: string) => {
    setSearchTerm(email);
    if (email.trim()) {
      searchUserByEmail(email);
    } else {
      clearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleToggleRole = async (id: number, currentRole: string) => {
    await toggleUserRole(id, currentRole);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">User Management</h1>
          <p className="text-gray-400 text-center">Search users by email and manage admin roles</p>
        </div>

        {/* Search Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email to search user..."
              />
            </div>
            <button
              onClick={() => handleSearch(searchTerm)}
              disabled={loading || !searchTerm.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer w-full lg:w-auto"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-white text-lg">Searching user...</div>
          </div>
        )}

        {/* User Display */}
        {user && !loading && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* User Info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Name</p>
                  <p className="text-white font-medium">{user.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Joined</p>
                  <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              {/* Role Toggle */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'admin' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                
                <button
                  onClick={() => handleToggleRole(user.id, user.role)}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    user.role === 'admin'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {loading ? 'Updating...' : `Make ${user.role === 'admin' ? 'Employee' : 'Admin'}`}
                </button>

                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No User Found Message */}
        {!user && searchTerm && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              No user found with email: {searchTerm}
            </div>
            <button
              onClick={handleClearSearch}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Initial State Message */}
        {!user && !searchTerm && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              Enter an email address to search for users
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Search by email to manage user roles
            </div>
          </div>
        )}
      </div>
    </div>
  );
}