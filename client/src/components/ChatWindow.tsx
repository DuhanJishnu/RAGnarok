"use client";
import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type Msg = { id: string; role: "user" | "assistant"; text: string };

export default function ChatWindow() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }; // Scroll to bottom whenever new messages are added if user is already at bottom
  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [messages, atBottom]); // Track scroll position

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 20);
  };

  const onSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: "u" + Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);

    setTimeout(() => {
      const reply: Msg = {
        id: "a" + Date.now(),
        role: "assistant",
        text: `${text}`,
      };
      setMessages((m) => [...m, reply]);
    }, 700);
  };

  return (
    <div className="relative flex flex-col w-full h-full  bg-gradient-to-b from-white/80 to-transparent dark:from-transparent rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="font-medium">Conversation</div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
            >
              <MessageBubble
                role={m.role}
                text={m.text}
                timestamp={new Date()}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scroll to bottom button */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 p-2 rounded-full bg-vsyellow text-black shadow-md hover:scale-105 transition"
        >
          <ChevronDownIcon className="w-5 h-5" />
          
        </button>
      )}

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
}
