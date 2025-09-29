"use client";
import { useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import withAuth from "@/components/withAuth";
import { ChatProvider } from "@/context/ChatContext";

function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <ChatProvider>
      <div className="bg-gray-50 text-gray-900 dark:bg-[#0f1724] dark:text-gray-100">
        <div className="min-h-screen flex">
          <Sidebar isOpen={isSidebarOpen} />
          <div className="flex-1 flex flex-col">
            <Header toggleSidebar={toggleSidebar} />
            <div className="h-full w-full">
              <ChatWindow />
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}

export default withAuth(Home);

