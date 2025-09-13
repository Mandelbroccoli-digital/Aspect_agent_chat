import React, { useState } from 'react';
import { Send, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { AspectChatColumn } from './AspectChatColumn';
import { useAspectChat } from '../hooks/useAspectChat';
import type { AspectResponse } from '../services/api';

export function ChatInterface() {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, error, sendMessage, clearChat } = useAspectChat();
  const [isOnline, setIsOnline] = useState(true);

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
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get responses for each aspect from the latest aspect message
  const getAspectResponses = (aspect: 'Logic' | 'Creative' | 'Analytical'): AspectResponse[] => {
    return messages
      .filter(msg => msg.type === 'aspects' && msg.aspects)
      .flatMap(msg => msg.aspects || [])
      .filter(response => response.aspect === aspect);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Aspect AI</h1>
            <p className="text-white/70 text-sm">
              Multi-perspective AI conversations powered by Hugging Face
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Clear</span>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
            {!isOnline && (
              <p className="text-red-200/70 text-xs mt-1">
                Make sure the backend server is running on http://localhost:8000
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chat Columns */}
      <div className="flex-1 flex">
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

      {/* Input Area */}
      <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question to get perspectives from all aspects..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50"
            disabled={isLoading || !isOnline}
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading || !isOnline}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center space-x-2 min-w-[100px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-white/50">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{messages.filter(m => m.type === 'user').length} messages sent</span>
        </div>
      </div>
    </div>
  );
}