import { MessageSquare, Sparkles, BarChart3, Loader2 } from 'lucide-react';
import type { AspectResponse } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../types/theme';

interface AspectChatColumnProps {
  aspect: 'Logic' | 'Creative' | 'Analytical';
  responses: AspectResponse[];
  isLoading?: boolean;
}

const aspectConfig = {
  Logic: {
    icon: MessageSquare,
    themeAccent: 'logic' as const,
    title: 'Logical Analysis'
  },
  Creative: {
    icon: Sparkles,
    themeAccent: 'creative' as const,
    title: 'Creative Insights'
  },
  Analytical: {
    icon: BarChart3,
    themeAccent: 'analytical' as const,
    title: 'Data Analysis'
  }
};

export function AspectChatColumn({ aspect, responses, isLoading = false }: AspectChatColumnProps) {
  const { theme } = useTheme();
  const currentTheme = themes[theme];
  const config = aspectConfig[aspect];
  
  return (
    <div className={`flex flex-col h-full ${currentTheme.colors.background.tertiary} rounded-lg border ${currentTheme.colors.border.primary}`}>
      <div className={`bg-gradient-to-r ${currentTheme.colors.accent[config.themeAccent]} p-4 rounded-t-lg`}>
        <div className="flex items-center space-x-2">
          <config.icon className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">{config.title}</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {responses.map((response, index) => (
          <div
            key={`${response.aspect}-${index}`}
            className={`${currentTheme.colors.background.secondary} backdrop-blur-sm rounded-lg p-4 border ${currentTheme.colors.border.secondary}`}
          >
            <p className={`${currentTheme.colors.text.primary} text-sm leading-relaxed`}>{response.response}</p>
            <div className={`flex items-center justify-between mt-3 pt-3 border-t ${currentTheme.colors.border.secondary}`}>
              <span className={`${currentTheme.colors.text.tertiary} text-xs`}>
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    response.confidence > 0.7 ? 'bg-green-400' :
                    response.confidence > 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className={`${currentTheme.colors.text.tertiary} text-xs`}>
                    {Math.round(response.confidence * 100)}%
                  </span>
                </div>
                <config.icon className={`w-4 h-4 ${currentTheme.colors.text.tertiary}`} />
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className={`${currentTheme.colors.background.secondary} backdrop-blur-sm rounded-lg p-4 border ${currentTheme.colors.border.secondary} flex items-center justify-center`}>
            <Loader2 className={`w-5 h-5 ${currentTheme.colors.text.tertiary} animate-spin mr-2`} />
            <span className={`${currentTheme.colors.text.tertiary} text-sm`}>Thinking...</span>
          </div>
        )}
        
        {responses.length === 0 && !isLoading && (
          <div className={`text-center ${currentTheme.colors.text.tertiary} text-sm py-8`}>
            <config.icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start a conversation to see {aspect.toLowerCase()} perspectives</p>
          </div>
        )}
      </div>
    </div>
  );
}