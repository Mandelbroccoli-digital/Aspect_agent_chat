import React, { useState } from 'react';
import { AspectChatColumn } from './AspectChatColumn';
import { Header } from './Header';
import { Input } from './Input';
import { Sidebar } from './Sidebar';
import { useAspectChat } from '../hooks/useAspectChat';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../types/theme';
import type { AspectResponse } from '../services/api';

export function ChatInterface() {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, error, sendMessage, clearChat } = useAspectChat();
  const [isOnline, setIsOnline] = useState(true);
  const { theme } = useTheme();
  const currentTheme = themes[theme];

  // Check backend connectivity
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const getAspectResponses = (aspect: 'Logic' | 'Creative' | 'Analytical'): AspectResponse[] => {
    return messages
      .filter(msg => msg.type === 'aspects' && msg.aspects)
      .flatMap(msg => msg.aspects || [])
      .filter(response => response.aspect === aspect);
  };

  return (
    <div className={`h-screen flex flex-col ${currentTheme.colors.background.primary}`}>
      <Sidebar onClearChat={clearChat} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        <Header isOnline={isOnline} error={error} />

        {/* Chat Columns */}
        <div className="flex-1 flex gap-4 p-4 md:p-6 overflow-auto">
          <AspectChatColumn
            aspect="Logic"
            responses={getAspectResponses('Logic')}
            isLoading={isLoading}
          />
          <AspectChatColumn
            aspect="Creative"
            responses={getAspectResponses('Creative')}
            isLoading={isLoading}
          />
          <AspectChatColumn
            aspect="Analytical"
            responses={getAspectResponses('Analytical')}
            isLoading={isLoading}
          />
        </div>

        <Input
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSend}
          isLoading={isLoading}
          isDisabled={!isOnline}
        />
      </div>
    </div>
  );
}