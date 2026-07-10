import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
  orchestrateChat,
  saveUserMessage,
  saveAssistantMessage,
  getMessages,
  logToolCall,
} from '../services/api';
import type {
  ModelConfig,
  AspectConfig,
  ToolDefinition,
  AspectResponse,
  ToolCallRecord,
} from '../services/types';

export interface ChatMessage {
  id: string;
  type: 'user' | 'aspects';
  content: string;
  timestamp: Date;
  aspects?: AspectResponse[];
}

export function useAspectChat(
  sessionId: string | null,
  models: ModelConfig[],
  aspects: AspectConfig[],
  tools: ToolDefinition[],
  toolCallingEnabled: boolean
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId || sessionId === loadedRef.current) return;
    loadedRef.current = sessionId;

    (async () => {
      try {
        const dbMessages = await getMessages(sessionId);
        const chatMsgs: ChatMessage[] = [];
        for (const msg of dbMessages) {
          chatMsgs.push({
            id: msg.id,
            type: 'user',
            content: msg.content,
            timestamp: new Date(msg.created_at),
          });
          if (msg.aspect_responses && msg.aspect_responses.length > 0) {
            chatMsgs.push({
              id: `${msg.id}_aspects`,
              type: 'aspects',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              aspects: msg.aspect_responses,
            });
          }
        }
        setMessages(chatMsgs);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setMessages([]);
      }
    })();
  }, [sessionId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading || !sessionId) return;

      setIsLoading(true);
      setError(null);

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        await saveUserMessage(sessionId, message);

        const enabledAspects = aspects.filter((a) => a.enabled);
        const enabledModels = models.filter((m) => m.enabled);
        const enabledTools = tools.filter((t) => t.enabled);

        const history = messages.slice(-6).map((m) => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.type === 'user' ? m.content : (m.aspects || []).map((a) => a.response).join(' '),
        }));

        const result = await orchestrateChat({
          message,
          session_id: sessionId,
          aspects: enabledAspects.map((a) => a.name),
          history,
          model_configs: enabledModels,
          aspect_configs: enabledAspects,
          tools: enabledTools,
          tool_calling_enabled: toolCallingEnabled,
        });

        const allToolCalls: ToolCallRecord[] = [];
        for (const resp of result.responses) {
          allToolCalls.push(...(resp.tool_calls || []));
        }

        await saveAssistantMessage(
          sessionId,
          message,
          result.responses,
          result.responses.map((r) => r.model_used).join(', '),
          allToolCalls
        );

        for (const tc of allToolCalls) {
          await logToolCall(tc.tool, tc.input, tc.output, 'success', null);
        }

        const aspectMsg: ChatMessage = {
          id: `aspects_${Date.now()}`,
          type: 'aspects',
          content: message,
          timestamp: new Date(),
          aspects: result.responses,
        };
        setMessages((prev) => [...prev, aspectMsg]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errMsg);
        const errorAspect: ChatMessage = {
          id: `error_${Date.now()}`,
          type: 'aspects',
          content: message,
          timestamp: new Date(),
          aspects: [
            {
              aspect: 'System',
              response: `Error: ${errMsg}`,
              model_used: 'none',
              tool_calls: [],
              confidence: 0,
              timestamp: new Date().toISOString(),
            },
          ],
        };
        setMessages((prev) => [...prev, errorAspect]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, models, aspects, tools, toolCallingEnabled, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
