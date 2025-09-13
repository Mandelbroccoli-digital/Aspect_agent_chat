import React from 'react';
import { MessageSquare, Sparkles, BarChart3, Loader2 } from 'lucide-react';
import type { AspectResponse } from '../services/api';

interface AspectChatColumnProps {
  aspect: 'Logic' | 'Creative' | 'Analytical';
  responses: AspectResponse[];
  isLoading?: boolean;
}

const aspectConfig = {
  Logic: {
    icon: MessageSquare,
    color: 'from-blue-500 to-blue-600',
    title: 'Logical Analysis'
  },
  Creative: {
    icon: Sparkles,
    color: 'from-purple-500 to-purple-600',
    title: 'Creative Insights'
  },
  Analytical: {
    icon: BarChart3,
    color: 'from-green-500 to-green-600',
    title: 'Data Analysis'
  }
};

export function AspectChatColumn({ aspect, responses, isLoading = false }: AspectChatColumnProps) {
  const config = aspectConfig[aspect];
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700">
      <div className={`bg-gradient-to-r ${config.color} p-4 rounded-t-lg`}>
        <div className="flex items-center space-x-2">
          <config.icon className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">{config.title}</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {responses.map((response, index) => (
          <div
            key={`${response.aspect}-${index}`}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
          >
            <p className="text-white/90 text-sm leading-relaxed">{response.response}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <span className="text-white/60 text-xs">
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    response.confidence > 0.7 ? 'bg-green-400' :
                    response.confidence > 0.4 ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white/60 text-xs">
                    {Math.round(response.confidence * 100)}%
                  </span>
                </div>
                <config.icon className="w-4 h-4 text-white/60" />
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white/60 animate-spin mr-2" />
            <span className="text-white/60 text-sm">Thinking...</span>
          </div>
        )}
        
        {responses.length === 0 && !isLoading && (
          <div className="text-center text-white/40 text-sm py-8">
            <config.icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start a conversation to see {aspect.toLowerCase()} perspectives</p>
          </div>
        )}
      </div>
    </div>
  );
}