"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Streamdown } from "streamdown";

export default function MessageBubble({
  role,
  text,
  image,
  timestamp,
  isStreaming  // NEW: whether this message is still streaming
}: Readonly<{
  role: "user" | "assistant";
  text: string;
  image?: File | string;
  timestamp: string | Date;
  isStreaming?: boolean;
}>) {
  const isUser = role === "user";
  const time = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`w-fit max-w-[80%] ${
        isUser ? "ml-auto text-right" : "mr-auto text-left"
      }`}
    >
      <div
        className={`p-3 rounded-xl shadow-sm transition-all ${
          isUser
            ? "bg-white/10 text-white"
            : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-gray-100"
        }`}
      >
        {image && (
          <div className="relative w-full max-w-sm h-64">
            <Image
              src={
                typeof image === "string" ? image : URL.createObjectURL(image) // blob URL for preview
              }
              alt="message"
              fill // makes it cover the parent container
              className="object-cover rounded-md"
            />
          </div>
        )}

        {text && (
          <div className="overflow-x-auto max-w-full">
            
            {role === "assistant" ? (
              // <Streamdown >{text}</Streamdown>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isStreaming ? 1 : 0.7 }}
              >
                <Streamdown>{text}</Streamdown>
              </motion.div>
            ) : (
              <p>{text}</p>
            )}
          </div>
        )}
      </div>

      <div
        className={`mt-1 text-xs ${isUser ? "text-gray-300" : "text-gray-500"}`}
      >
        {formattedTime}
      </div>
    </div>
  );
}
