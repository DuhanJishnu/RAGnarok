// app/admin/page.tsx
import React from "react";
import FileUpload from "../admin/components/FileUpload/index";
import AdminUserManager from "./components/AdminHandling/AdminUserManager";

const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage files and users efficiently</p>
        </div>
        
        <div className="grid lg:grid-cols-1 gap-8">
          <FileUpload/>
          <AdminUserManager/>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;