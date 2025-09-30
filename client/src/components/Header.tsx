"use client";
import { Bars3Icon } from "@heroicons/react/24/outline";

export default function Header({ toggleSidebar }: Readonly<{ toggleSidebar: () => void }>) {


  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800/60">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">MyChat</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
          Signed in as <span className="font-medium">You</span>
        </div>
      </div>
    </header>
  );
}
