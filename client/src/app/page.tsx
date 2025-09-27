"use client";
import ChatWindow from "@/components/ChatWindow";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900 dark:bg-[#0f1724] dark:text-gray-100">
            <div className="min-h-screen flex">
              <Sidebar />
              <div className="flex-1 flex flex-col">
                <Header />
                {/* <main className="flex-1"><ChatWindow/></main> */}
                <div className="h-full w-full">
                  <ChatWindow />
                </div>
              </div>
            </div>
          </div>
  );
}
