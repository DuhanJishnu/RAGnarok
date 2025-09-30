"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRecentConversations } from '@/service/conv';
import { useChat } from '@/context/ChatContext';
import { getExchanges } from '@/service/exch';

interface Conversation {
  id: string;
  title: string;
}

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { setExchanges, setConvId, setConvTitle } = useChat();
  const loader = useRef(null);

  const fetchConversations = async (page: number) => {
    try {
      const res = await getRecentConversations(page);
      setConversations(prev => [...prev, ...res.conversations]);
      setHasMore(res.pagination.totalPages > page);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    }
  };

  useEffect(() => {
    fetchConversations(page);
  }, [page]);

  const handleObserver = useCallback((entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { root: null, rootMargin: "20px" });
    if (loader.current) {
      observer.observe(loader.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleNewChat = () => {
    setExchanges([]);
    setConvId('');
    setConvTitle('');
  };

  const handleConversationClick = async (conv: Conversation) => {
    setConvId(conv.id);
    setConvTitle(conv.title);
    try {
      const res = await getExchanges(conv.id, 1);
      setExchanges(res.exchanges);
    } catch (error) {
      console.error("Failed to fetch exchanges", error);
    }
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 p-4 flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <button onClick={handleNewChat} className="bg-blue-500 text-white rounded-lg p-2 mb-4">
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conv => (
          <div 
            key={conv.id} 
            onClick={() => handleConversationClick(conv)} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-lg">
            {conv.title}
          </div>
        ))}
        {hasMore && <div ref={loader}>Loading...</div>}
      </div>
    </div>
  );
};

export default Sidebar;

