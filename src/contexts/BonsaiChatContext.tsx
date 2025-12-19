import { createContext, useContext, useRef, useCallback, ReactNode, useState, useEffect } from 'react';
import type { BotDojoChatControl } from '@botdojo/chat-sdk';

interface BonsaiChatContextType {
  /** Register the chat control (called by BonsaiShopAgent) */
  registerChatControl: (control: BotDojoChatControl) => void;
  /** Called when chat is ready (called by BonsaiShopAgent's onReady) */
  onChatReady: () => void;
  /** Send a message to the chat (queues if not ready, opens chat panel) */
  sendMessage: (prompt: string) => Promise<void>;
  /** Open the chat panel */
  openChat: () => void;
  /** Notify context that chat panel is now open */
  notifyChatPanelOpen: () => void;
  /** Whether the chat is ready */
  isReady: boolean;
}

interface BonsaiChatProviderProps {
  children: ReactNode;
  /** Function to open the chat panel (provided by parent layout) */
  onOpenChat: () => void;
  /** Whether the chat panel is currently open */
  isChatOpen?: boolean;
}

const BonsaiChatContext = createContext<BonsaiChatContextType | null>(null);

export function BonsaiChatProvider({ children, onOpenChat, isChatOpen = false }: BonsaiChatProviderProps) {
  // Use state for chatControl to trigger effect when it's set
  const [chatControl, setChatControl] = useState<BotDojoChatControl | null>(null);
  const chatControlRef = useRef<BotDojoChatControl | null>(null);
  const pendingPromptRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const registerChatControl = useCallback((control: BotDojoChatControl) => {
    chatControlRef.current = control;
    setChatControl(control);
  }, []);

  const openChat = useCallback(() => {
    onOpenChat();
  }, [onOpenChat]);

  // Kept for backwards compatibility but no longer needed
  const notifyChatPanelOpen = useCallback(() => {
    // No-op - panel state is now passed via prop
  }, []);

  const onChatReady = useCallback(() => {
    setIsReady(true);
    // Note: Pending prompt is now handled by the useEffect that watches all conditions
  }, []);

  // Effect to send pending prompt when all conditions are met:
  // - chatControl is available
  // - isReady is true  
  // - isChatOpen is true (panel must be open for iframe to work)
  // This handles the race condition between all the callbacks
  useEffect(() => {
    if (isReady && chatControl && isChatOpen && pendingPromptRef.current) {
      // Small delay to ensure the panel transition is complete and iframe is ready
      const timeoutId = setTimeout(() => {
        if (pendingPromptRef.current) {
          const prompt = pendingPromptRef.current;
          pendingPromptRef.current = null;
          console.log('[BonsaiChat] Sending pending prompt via effect');
          chatControl.sendFlowRequest({ text_input: prompt })
            .catch((err) => console.error('[BonsaiChat] Failed to send pending prompt:', err));
        }
      }, 150); // Slightly longer delay to account for panel animation
      return () => clearTimeout(timeoutId);
    }
  }, [isReady, chatControl, isChatOpen]);

  const sendMessage = useCallback(async (prompt: string) => {
    // Always open the chat panel so users can see the response
    openChat();
    
    // If panel is already open and everything is ready, send immediately with a small delay
    // to ensure any UI updates have completed
    if (isChatOpen && isReady && chatControl) {
      console.log('[BonsaiChat] Panel already open and ready, sending with delay');
      setTimeout(() => {
        chatControl.sendFlowRequest({ text_input: prompt })
          .catch((err) => console.error('[BonsaiChat] Failed to send prompt:', err));
      }, 100);
    } else {
      // Queue the prompt - it will be sent by the effect when the panel is open and ready
      console.log('[BonsaiChat] Queueing prompt, will send when panel is open and ready');
      pendingPromptRef.current = prompt;
    }
  }, [openChat, isChatOpen, isReady, chatControl]);

  return (
    <BonsaiChatContext.Provider value={{
      registerChatControl,
      onChatReady,
      sendMessage,
      openChat,
      notifyChatPanelOpen,
      isReady,
    }}>
      {children}
    </BonsaiChatContext.Provider>
  );
}

export function useBonsaiChat() {
  const context = useContext(BonsaiChatContext);
  if (!context) {
    throw new Error('useBonsaiChat must be used within a BonsaiChatProvider');
  }
  return context;
}

/** 
 * Safe version that returns null if not in provider context 
 * (useful for components that may be rendered outside bonsai shop)
 */
export function useBonsaiChatSafe() {
  return useContext(BonsaiChatContext);
}

