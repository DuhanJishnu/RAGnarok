"use client";
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";


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
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  refreshConversations: () => void;
  setRefreshConversations: (fn: () => void) => void;
  addNewConversation: (conversation: { id: string; title: string }) => void;
  setAddNewConversation: (fn: (conversation: { id: string; title: string }) => void) => void;
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
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};