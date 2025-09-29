"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Exchange {
  id: string;
  userQuery: string;
  systemResponse: string;
  createdAt: string;
}

interface ChatContextType {
  exchanges: Exchange[];
  setExchanges: React.Dispatch<React.SetStateAction<Exchange[]>>;
  convId: string;
  setConvId: React.Dispatch<React.SetStateAction<string>>;
  convTitle: string;
  setConvTitle: React.Dispatch<React.SetStateAction<string>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [convId, setConvId] = useState("");
  const [convTitle, setConvTitle] = useState("");

  return (
    <ChatContext.Provider value={{ exchanges, setExchanges, convId, setConvId, convTitle, setConvTitle }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
