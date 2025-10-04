"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { createExchange, getExchanges, streamResponse } from "@/service/exch";
import { useChat } from "@/context/ChatContext";

export default function ChatWindow() {
  const {
    exchanges,
    setExchanges,
    convId,
    setConvId,
    convTitle,
    setConvTitle,
    refreshConversations,
    addNewConversation,
  } = useChat();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [exchangePage, setExchangePage] = useState(1);
  const [hasMoreExchanges, setHasMoreExchanges] = useState(true);
  const loader = useRef(null);
  const activeStreams = useRef<Array<() => void>>([]);

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

  const handleObserver = useCallback(
    (entities: IntersectionObserverEntry[]) => {
      const target = entities[0];
      if (target.isIntersecting && hasMoreExchanges) {
        setExchangePage((prevPage) => prevPage + 1);
      }
    },
    [hasMoreExchanges]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
    });
    if (loader.current) {
      observer.observe(loader.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  // Reset page when conversation changes
  useEffect(() => {
    setExchangePage(1);
    setHasMoreExchanges(true);
    
    // Clean up any active streams when conversation changes
    activeStreams.current.forEach(closeStream => closeStream());
    activeStreams.current = [];
  }, [convId]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      activeStreams.current.forEach(closeStream => closeStream());
      activeStreams.current = [];
    };
  }, []);

  useEffect(() => {
    if (convId) {
      getExchanges(convId, exchangePage).then((res) => {
        if (exchangePage === 1) {
          // First page: reverse to show oldest first, newest last
          setExchanges([...res.exchanges].reverse());
        } else {
          // Additional pages: prepend older messages (already in desc order from backend)
          setExchanges((prev) => [[...res.exchanges].reverse(), ...prev].flat());
        }
        setHasMoreExchanges(res.exchanges.length > 0);
      });
    }
  }, [convId, exchangePage, setExchanges]);

  const onSend = async (text: string, image?: File) => {
    if (!text.trim() && !image) return;
    // create a temporary "user message"
    const tempId = Date.now().toString();

    const tempExchange = {
      id: tempId,
      userQuery: text,
      systemResponse: "", // wait till response arrives
      createdAt: new Date().toISOString(),
      image: image ? URL.createObjectURL(image) : undefined,
    };

    // immediately show user’s message
    setExchanges((prev) => [...prev, tempExchange]);
    try {
      const res = await createExchange(text, convId, convTitle, image);

      if (!convId && res.conversation) {
        setConvId(res.conversation.id);
        setConvTitle(res.conversation.title);
        // Add the new conversation to the sidebar list
        addNewConversation({
          id: res.conversation.id,
          title: res.conversation.title
        });
      }

      // Start streaming the response
      const closeStream = await streamResponse(
        res.responseId,
        (message: string) => {
          // Update the temporary exchange with streamed content
          console.log("Streaming message:", message);
          setExchanges((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, systemResponse: m.systemResponse + message } : m
            )
          );
        },
        (error: any) => {
          console.log("Error in stream response function");
          console.error("Streaming error:", error);
          setExchanges((prev) =>
            prev.map((m) =>
              m.id === tempId 
                ? { ...m, systemResponse: m.systemResponse + "\n\nError: Failed to receive response" }
                : m
            )
          );
        }
      );

      // Store the close function for cleanup
      activeStreams.current.push(closeStream);
    } catch (err) {
      console.error("Send failed", err);
      // optionally mark failed state
      setExchanges((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, systemResponse: " Failed to get response " } : m
        )
      );
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-gradient-to-b from-white/80 to-transparent dark:from-transparent rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="font-medium">{convTitle || "New Chat"}</div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
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
          type="button" 
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="absolute bottom-20 right-4 p-2 rounded-full bg-vsyellow text-black shadow-md hover:scale-105 transition"
        >
          <ChevronDownIcon className="w-5 h-5" />
        </button>
      )}

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <ChatInput onSend={onSend} conv_id={convId} setConvId={setConvId} />
      </div>
    </div>
  );
}
