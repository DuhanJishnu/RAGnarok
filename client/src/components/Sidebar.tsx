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
  const { setExchanges, setConvId, setConvTitle, setRefreshConversations, setAddNewConversation } = useChat();
  const loader = useRef(null);

  const fetchConversations = async (page: number) => {
    try {
      const res = await getRecentConversations(page);
      setConversations(prev => {
        const existingIds = new Set(prev.map(conv => conv.id));
        const newConversations = res.conversations.filter((conv: Conversation) => !existingIds.has(conv.id));
        return [...prev, ...newConversations];
      });
      setHasMore(res.pagination.totalPages > page);
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    }
  };

  const refreshConversationList = useCallback(async () => {
    try {
      // Reset pagination state when refreshing
      setPage(1);
      const res = await getRecentConversations(1);
      setConversations(res.conversations);
      setHasMore(res.pagination.totalPages > 1);
    } catch (error) {
      console.error("Failed to refresh conversations", error);
    }
  }, []);

  const addNewConversationToList = useCallback((conversation: Conversation) => {
    setConversations(prev => {
      // Check to see if conversation exists
      const existingIds = new Set(prev.map(conv => conv.id));
      if (existingIds.has(conversation.id)) {
        console.log('Conversation already exists, skipping:', conversation.id);
        return prev;
      }
      console.log('Adding new conversation:', conversation.id);
      return [conversation, ...prev];
    });
  }, []);

  useEffect(() => {
    setRefreshConversations(() => refreshConversationList);
    setAddNewConversation(() => addNewConversationToList);
    
    // Cleanup callbacks when component will unmount
    return () => {
      setRefreshConversations(() => () => {});
      setAddNewConversation(() => () => {});
    };
  }, [refreshConversationList, setRefreshConversations, addNewConversationToList, setAddNewConversation]);

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
      // Reverse to show oldest first, newest last (backend returns newest first)
      setExchanges([...res.exchanges].reverse());
    } catch (error) {
      console.error("Failed to fetch exchanges", error);
    }
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 p-4 flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'} h-full`}>
      <button onClick={handleNewChat} className="bg-blue-500 text-white rounded-lg p-2 mb-4 flex-shrink-0">
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
        <div className="space-y-1">
          {(() => {
            // Debug: Check for duplicate IDs
            const ids = conversations.map(conv => conv.id);
            const uniqueIds = new Set(ids);
            if (ids.length !== uniqueIds.size) {
              console.error('Duplicate conversation IDs detected:', ids.filter((id, index) => ids.indexOf(id) !== index));
            }
            return conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => handleConversationClick(conv)} 
                className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-lg text-sm truncate transition-colors duration-150 border border-transparent hover:border-gray-300 dark:hover:border-gray-600">
                {conv.title}
              </div>
            ));
          })()}
        </div>
        {hasMore && <div ref={loader} className="p-2 text-center text-sm text-gray-500">Loading...</div>}
      </div>
    </div>
  );
};

export default Sidebar;

