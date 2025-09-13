import { useState, useCallback, useRef } from 'react';
import { aspectAI, type AspectResponse, type ChatResponse } from '../services/api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'aspects';
  content: string;
  timestamp: Date;
  aspects?: AspectResponse[];
}

export interface UseAspectChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  sessionId: string;
}

export function useAspectChat(): UseAspectChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response: ChatResponse = await aspectAI.sendMessage({
        message,
        session_id: sessionIdRef.current,
        aspects: ['Logic', 'Creative', 'Analytical'],
      });

      // Add aspect responses
      const aspectMessage: ChatMessage = {
        id: response.message_id,
        type: 'aspects',
        content: message, // Original user message for context
        timestamp: new Date(),
        aspects: response.responses,
      };

      setMessages(prev => [...prev, aspectMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'aspects',
        content: message,
        timestamp: new Date(),
        aspects: [
          {
            aspect: 'System',
            response: `Error: ${errorMessage}. Please check that the backend server is running.`,
            timestamp: new Date().toISOString(),
            confidence: 0,
          },
        ],
      };

      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(async () => {
    try {
      await aspectAI.clearSession(sessionIdRef.current);
      setMessages([]);
      setError(null);
      // Generate new session ID
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (err) {
      console.error('Failed to clear session:', err);
      // Clear locally even if server request fails
      setMessages([]);
      setError(null);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    sessionId: sessionIdRef.current,
  };
}