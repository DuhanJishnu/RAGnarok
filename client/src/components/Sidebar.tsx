"use client";
import { useState } from "react";
import { PlusIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [chats, setChats] = useState(() => [
    { id: "1", title: "Welcome chat" },
    { id: "2", title: "Project plan" },
  ]);

  const [open, setOpen] = useState(false); // sidebar open on small screens

  const addNew = () =>
    setChats((s) => [{ id: String(Date.now()), title: "New chat" }, ...s]);

  return (
    <>
      {/* Small screen menu button */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-vsyellow text-black rounded-md shadow-md"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Sidebar overlay for small screens */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      ></div>

      <aside
        className={`fixed sm:relative top-0 left-0 min-h-screen z-50 w-64 bg-white dark:bg-[#071027] border-r border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-4 transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}
      >
        {/* Close button for small screens */}
        <div className="sm:hidden flex justify-end mb-2">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/6 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <h2 className="hidden sm:block font-semibold">Chats</h2>
          <button
            onClick={addNew}
            aria-label="New chat"
            className="p-2 rounded-md hover:bg-violet-950 transition hidden sm:flex"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <ul className="flex flex-col gap-2">
            {/* Always-visible New Chat tab */}
            <li>
              <button
                onClick={addNew}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-violet-950 transition flex items-center gap-3 font-semibold text-vsyellow"
              >
                <div className=" p-2 bg-gray-200 dark:bg-white/6 rounded flex items-center justify-center">
                  <PlusIcon className="w-4 h-4" />
                </div>
                New Chat
              </button>
            </li>

            {chats.map((chat) => (
              <li key={chat.id} className="group">
                <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/6 transition flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-white/6 rounded flex items-center justify-center text-xs">
                    {chat.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">{chat.title}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        
      </aside>
    </>
  );
}
