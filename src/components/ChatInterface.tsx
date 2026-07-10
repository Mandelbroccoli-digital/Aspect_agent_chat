import React, { useState, useEffect, useCallback } from 'react';
import { Send, RotateCcw, Wrench, Loader as Loader2 } from 'lucide-react';
import { AspectChatColumn } from './AspectChatColumn';
import { Sidebar } from './Sidebar';
import { useAspectChat } from '../hooks/useAspectChat';
import {
  getSessions,
  createSession,
  deleteSession,
  getModelConfigs,
  getAspects,
  getToolDefinitions,
  getConnections,
  updateAspect,
} from '../services/api';
import type {
  Session,
  ModelConfig,
  AspectConfig,
  ToolDefinition,
  Connection,
  AspectResponse,
} from '../services/types';

export function ChatInterface() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [aspects, setAspects] = useState<AspectConfig[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [toolCallingEnabled, setToolCallingEnabled] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  const { messages, isLoading, error, sendMessage, clearChat } = useAspectChat(
    currentSessionId,
    models,
    aspects,
    tools,
    toolCallingEnabled
  );

  const loadData = useCallback(async () => {
    try {
      const [s, m, a, t, c] = await Promise.all([
        getSessions(),
        getModelConfigs(),
        getAspects(),
        getToolDefinitions(),
        getConnections(),
      ]);
      setSessions(s);
      setModels(m);
      setAspects(a);
      setTools(t);
      setConnections(c);
      if (s.length > 0 && !currentSessionId) {
        setCurrentSessionId(s[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [currentSessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewSession = async () => {
    try {
      const s = await createSession(`Session ${sessions.length + 1}`);
      setSessions((prev) => [s, ...prev]);
      setCurrentSessionId(s.id);
      clearChat();
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        clearChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleModelChange = async (aspectId: string, modelConfigId: string) => {
    try {
      await updateAspect(aspectId, { model_config_id: modelConfigId });
      setAspects((prev) =>
        prev.map((a) => (a.id === aspectId ? { ...a, model_config_id: modelConfigId } : a))
      );
    } catch (err) {
      console.error('Failed to update aspect model:', err);
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (!currentSessionId) {
      await handleNewSession();
    }
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAspectResponses = (aspectName: string): AspectResponse[] => {
    return messages
      .filter((msg) => msg.type === 'aspects' && msg.aspects)
      .flatMap((msg) => msg.aspects || [])
      .filter((resp) => resp.aspect === aspectName);
  };

  const enabledAspects = aspects.filter((a) => a.enabled);

  if (loadingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          clearChat();
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        models={models}
        aspects={aspects}
        tools={tools}
        connections={connections}
        onDataChange={loadData}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">
                {sessions.find((s) => s.id === currentSessionId)?.title || 'Aspect AI'}
              </h1>
              <p className="text-slate-400 text-xs">
                {enabledAspects.length} aspects · {models.filter((m) => m.enabled).length} models · {tools.filter((t) => t.enabled).length} tools
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setToolCallingEnabled(!toolCallingEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  toolCallingEnabled
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Tools {toolCallingEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs transition-colors border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}
        </div>

        {/* Chat Columns */}
        <div className="flex-1 flex gap-3 p-4 overflow-hidden">
          {enabledAspects.length > 0 ? (
            enabledAspects.map((aspect) => (
              <AspectChatColumn
                key={aspect.id}
                aspect={aspect}
                responses={getAspectResponses(aspect.name)}
                isLoading={isLoading}
                models={models}
                onModelChange={(modelId) => handleModelChange(aspect.id, modelId)}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p>No aspects enabled. Create aspects in the sidebar.</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-slate-900/50 backdrop-blur-md border-t border-slate-700/50 px-6 py-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question to get perspectives from all aspects..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 transition-all"
              disabled={isLoading || !currentSessionId}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading || !currentSessionId}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all duration-200 flex items-center gap-2 min-w-[100px]"
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
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 max-w-4xl mx-auto">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{messages.filter((m) => m.type === 'user').length} messages sent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
