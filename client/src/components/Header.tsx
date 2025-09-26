"use client";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function Header() {


  return (
    <header className="invisible sm:visible flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-md">
          CG
        </div>
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
