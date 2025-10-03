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
}
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [convId, setConvId] = useState("");
  const [convTitle, setConvTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Changed from true to false

  const value = useMemo(
    () => ({
      exchanges,
      setExchanges,
      convId,
      setConvId,
      convTitle,
      setConvTitle,
      isLoading,
      setIsLoading,
    }),
    [exchanges, convId, convTitle, isLoading]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};