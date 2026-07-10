import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../types/theme';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  placeholder?: string;
}

export function Input({
  value,
  onChange,
  onSend,
  isLoading,
  isDisabled,
  placeholder = 'Ask a question to get perspectives from all aspects...',
}: InputProps) {
  const { theme } = useTheme();
  const currentTheme = themes[theme];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`${currentTheme.colors.background.secondary} border-t ${currentTheme.colors.border.primary} p-4 md:p-6`}>
      <div className="flex space-x-3">
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || isDisabled}
            rows={1}
            className={`flex-1 resize-none ${currentTheme.colors.background.tertiary} border ${currentTheme.colors.border.primary} rounded-lg px-4 py-3 ${currentTheme.colors.text.primary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
          />
          <p className={`text-xs ${currentTheme.colors.text.tertiary} mt-2`}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>

        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading || isDisabled}
          className={`self-start mt-1 px-6 py-3 bg-gradient-to-r ${currentTheme.colors.accent.logic} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center space-x-2 min-w-[110px] font-semibold text-white`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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
    </div>
  );
}
