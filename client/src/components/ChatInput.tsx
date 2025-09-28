"use client";
import { useState , useRef } from "react";
import { PaperAirplaneIcon , PhotoIcon, XMarkIcon} from "@heroicons/react/24/solid";

export default function ChatInput({
  onSend,
}: Readonly<{
  onSend: (txt: string,  image?: File) => void;
}>) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    console.log("sending", text, image);
    if (!text.trim() && !image) return;
    onSend( text.trim(), image || undefined );
    setText("");
    setImage(null);
    // Reset file input so the same file can be selected again
    //if (inputRef.current) inputRef.current.value = "";
  };
  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) setImage(file);

    // Always reset input value immediately
    e.target.value = "";
  };
   return (
    <div className="flex flex-col gap-2">
      {/* Image preview */}
      {image && (
        <div className="relative w-24 h-24">
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            className="object-cover w-full h-full rounded-md border border-gray-300 dark:border-gray-700"
          />
          
          <button
            onClick={() => setImage(null)}
            className="absolute top-1 right-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <XMarkIcon className="w-4 h-4 text-gray-800 dark:text-gray-200" />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        {/* File input (hidden, trigger by button) */}
        <input
          type="file"
          accept="image/*"
          id="chat-image"
          className="hidden"
          ref={inputRef}
          onChange={handleFileChange}
        />
        <label
          htmlFor="chat-image"
          aria-label="Upload image"
          title="Upload image"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer hover:scale-105 active:scale-95 transition"
        >
          <PhotoIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type your query..."
          rows={1}
          className="resize-none flex-1 min-h-[44px] max-h-40 rounded-md p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-vsyellow/40 transition-all"
        />

        <button
          onClick={send}
          aria-label="Send"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-vsyellow text-black font-semibold hover:scale-105 active:scale-95 transition"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
