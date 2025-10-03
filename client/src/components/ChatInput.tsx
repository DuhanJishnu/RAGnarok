"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { PaperAirplaneIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";


export default function ChatInput({
  onSend,
  conv_id,
  setConvId,
}: Readonly<{
  onSend: (txt: string, image?: File) => void;
  conv_id: string;
  setConvId: (conv_id: string) => void;
}>) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [text]);

  const send = () => {
    if (!text.trim() && !image) return;
    onSend(text.trim(), image || undefined);
    setText("");
    setImage(null);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      send();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      setImage(file);
    }
    e.target.value = "";
  };

  const removeImage = () => {
    setImage(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Image preview */}
      {image && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block w-fit"
        >
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-vsyellow/30 shadow-sm">
            <Image
              src={URL.createObjectURL(image)}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-lg"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="flex gap-3 items-end">
        {/* File input */}
        <input
          type="file"
          accept="image/*"
          id="chat-image"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload image"
          title="Upload image"
          className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700"
        >
          <PhotoIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Type your message..."
            rows={1}
            className="w-full resize-none min-h-[48px] max-h-32 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-vsyellow/50 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <button
          onClick={send}
          disabled={!text.trim() && !image}
          aria-label="Send message"
          className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-vsyellow text-black font-semibold hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:dark:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Helper text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}