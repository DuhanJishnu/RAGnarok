"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { createExchange, getExchanges } from "@/service/exch";
import { useChat } from "@/context/ChatContext";

export default function ChatWindow() {
  const { exchanges, setExchanges, convId, setConvId, convTitle, setConvTitle } = useChat();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [exchangePage, setExchangePage] = useState(1);
  const [hasMoreExchanges, setHasMoreExchanges] = useState(true);
  const loader = useRef(null);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }; 

  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [exchanges, atBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 20);
  };

  const handleObserver = useCallback((entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting && hasMoreExchanges) {
      setExchangePage(prevPage => prevPage + 1);
    }
  }, [hasMoreExchanges]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { root: null, rootMargin: "20px" });
    if (loader.current) {
      observer.observe(loader.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    if (convId) {
      getExchanges(convId, exchangePage).then(res => {
        setExchanges(prev => [...res.exchanges, ...prev]);
        setHasMoreExchanges(res.exchanges.length > 0);
      });
    }
  }, [convId, exchangePage, setExchanges]);

  const onSend = async(text: string, image?: File) => {
    if (!text.trim() && !image) return;

    const reply = await createExchange(text, convId, convTitle, image)
    if (!convId) {
      setConvId(reply.conversation.id);
      setConvTitle(reply.conversation.title);
    }
    setExchanges(prev => [...prev, reply.exchange]);
  };


  return (
    <div className="relative flex flex-col w-full h-full  bg-gradient-to-b from-white/80 to-transparent dark:from-transparent rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="font-medium">{convTitle || "New Chat"}</div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {hasMoreExchanges && <div ref={loader}>Loading...</div>}
        <AnimatePresence initial={false} mode="popLayout">
          {exchanges.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
            >
              <MessageBubble
                role="user"
                text={m.userQuery}
                timestamp={m.createdAt}
              />
              <MessageBubble
                role="assistant"
                text={m.systemResponse}
                timestamp={m.createdAt}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 p-2 rounded-full bg-vsyellow text-black shadow-md hover:scale-105 transition"
        >
          <ChevronDownIcon className="w-5 h-5" />
          
        </button>
      )}

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <ChatInput onSend={onSend} conv_id={convId} setConvId={setConvId} />
      </div>
    </div>
  );
}
