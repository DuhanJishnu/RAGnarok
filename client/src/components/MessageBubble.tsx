"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({
  role,
  text,
  image,
  timestamp,
}: Readonly<{
  role: "user" | "assistant";
  text: string;
  image?: File | string;
  timestamp: string | Date;
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
        {/* {image && (
          <img
            src={typeof image === "string" ? image : URL.createObjectURL(image)}
            alt="message"
            className="max-w-full max-h-64 rounded-md object-cover"
          />
        )} */}
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ ...props }) => (
                  <h1 className="text-xl font-bold my-2" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-lg font-semibold my-2" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-md font-semibold my-1" {...props} />
                ),
                p: ({ ...props }) => <p className="my-1" {...props} />,
                ul: ({ ...props }) => (
                  <ul className="list-disc ml-5 my-1" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal ml-5 my-1" {...props} />
                ),
                li: ({ ...props }) => <li className="my-1" {...props} />,
                code: ({ ...props }) => (
                  <code
                    className="bg-gray-200 dark:bg-white/10 px-1 py-0.5 rounded"
                    {...props}
                  />
                ),
              }}
            >
              {text}
            </ReactMarkdown>
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
