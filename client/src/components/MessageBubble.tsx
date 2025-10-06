"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Streamdown } from "streamdown";

export default function MessageBubble({
  role,
  text,
  image,
  timestamp,
  isStreaming,
  files
}: Readonly<{
  role: "user" | "assistant";
  text: string;
  image?: File | string;
  timestamp: string | Date;
  isStreaming?: boolean;
  files?: Array<string>;
}>) {
  const isUser = role === "user";
  const time = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Convert literal \n to actual newlines for assistant messages
  const processedText = role === "assistant" 
    ? text.replace(/\\n/g, '\n')
    : text;

  return (
    <div
      className={`w-fit max-w-[80%] ${
        isUser ? "ml-auto text-right" : "mr-auto text-left"
      }`}
    >
      <div
        className={`p-3 rounded-xl transition-all ${
          isUser
            ? "bg-white/10 text-white"
            : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {image && (
          <div className="relative w-full max-w-sm h-64">
            <Image
              src={
                typeof image === "string" ? image : URL.createObjectURL(image)
              }
              alt="message"
              fill
              className="object-cover rounded-md"
            />
          </div>
        )}

        {text && (
          <div className="overflow-x-auto max-w-full">
            {role === "assistant" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isStreaming ? 1 : 0.7 }}
              >
                {/* Use processedText with actual newlines */}
                <Streamdown>{processedText}</Streamdown>
              </motion.div>
            ) : (
              <p>{text}</p>
            )}
          </div>
        )}
      </div>

      <div>
        {files && files.length > 0 && (
          <ul className="mt-2">
            {files.map((file) => (
              <li key={file} className="text-sm text-gray-500 dark:text-gray-400">
                <Image
                  src={`${process.env.NEXT_PUBLIC_FILE_BASE_URL}/api/file/v1/thumb/${file}`}
                  alt={file}
                  className="w-12 h-12 object-cover rounded-md"
                  width={12}
                  height={12}
                />
                <a href={`${process.env.FILE_BASE_URL}/api/file/v1/files/${file}`}>{file}</a>
              </li>
            ))}
          </ul>
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