import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ChatPanelContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  totalUnread: number;
  setTotalUnread: (n: number) => void;
  selectedPhone: string | null;
  openChatWithPhone: (phone: string) => void;
}

const ChatPanelContext = createContext<ChatPanelContextType | null>(null);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);
  const openChatWithPhone = useCallback((phone: string) => {
    setSelectedPhone(phone);
    setIsOpen(true);
  }, []);

  return (
    <ChatPanelContext.Provider value={{ isOpen, open, close, toggle, totalUnread, setTotalUnread, selectedPhone, openChatWithPhone }}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export function useChatPanel() {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) throw new Error("useChatPanel must be inside ChatPanelProvider");
  return ctx;
}
