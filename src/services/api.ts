import type {
  AspectResponse,
  ModelConfig,
  AspectConfig,
  ToolDefinition,
  MessageRow,
  ToolCallRecord,
} from './types';

export type { AspectResponse, ModelConfig, AspectConfig, ToolDefinition, ToolCallRecord, MessageRow } from './types';

export interface ChatResponse {
  responses: AspectResponse[];
  session_id: string;
  message_id: string;
}

export interface SendMessageRequest {
  message: string;
  session_id: string;
  aspects?: string[];
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model_configs?: ModelConfig[];
  aspect_configs?: AspectConfig[];
  tools?: ToolDefinition[];
  tool_calling_enabled?: boolean;
}

const DEFAULT_BASE_URL = 'http://localhost:8000';
const LOCAL_STORAGE_PREFIX = 'aspect_ai_chat_messages';

function getBaseURL() {
  return import.meta.env.VITE_API_URL ?? DEFAULT_BASE_URL;
}

function getLocalStorageKey(sessionId: string) {
  return `${LOCAL_STORAGE_PREFIX}:${sessionId}`;
}

function loadLocalMessages(sessionId: string): MessageRow[] {
  const raw = localStorage.getItem(getLocalStorageKey(sessionId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as MessageRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(sessionId: string, messages: MessageRow[]) {
  localStorage.setItem(getLocalStorageKey(sessionId), JSON.stringify(messages));
}

function createMessageRow(overrides: Partial<MessageRow> & { session_id: string; role: 'user' | 'assistant' | 'system'; content: string }): MessageRow {
  return {
    id: overrides.id ?? `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    session_id: overrides.session_id,
    user_id: overrides.user_id ?? 'local',
    role: overrides.role,
    content: overrides.content,
    aspect_responses: overrides.aspect_responses ?? [],
    model_used: overrides.model_used ?? null,
    tool_calls: overrides.tool_calls ?? [],
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

class AspectAIAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = getBaseURL();
  }

  async sendMessage(request: SendMessageRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getSessionHistory(sessionId: string): Promise<{ session_id: string; history: Array<{ user_message: string; responses: Record<string, string>; timestamp: string }> }> {
    const response = await fetch(`${this.baseURL}/api/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get session history: ${response.status}`);
    }

    return response.json();
  }

  async clearSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/session/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear session: ${response.status}`);
    }
  }

  async healthCheck(): Promise<{
    status: string;
    models_status: Record<string, string>;
    cuda_available: boolean;
  }> {
    const response = await fetch(`${this.baseURL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

const remoteAPI = new AspectAIAPI();

function localOrchestrateChat(request: SendMessageRequest): ChatResponse {
  const now = new Date().toISOString();
  const aspectNames = request.aspects?.length ? request.aspects : ['Logic', 'Creative', 'Analytical'];

  return {
    session_id: request.session_id,
    message_id: `local_${Date.now()}`,
    responses: aspectNames.map((aspect) => ({
      aspect,
      response: `Local fallback response for "${request.message}" from the ${aspect} aspect.`,
      model_used: 'local-fallback',
      tool_calls: [],
      confidence: 0.65,
      timestamp: now,
    })),
  };
}

export async function orchestrateChat(request: SendMessageRequest): Promise<ChatResponse> {
  try {
    return await remoteAPI.sendMessage(request);
  } catch (err) {
    console.warn('Remote orchestration request failed, using local fallback:', err);
    return localOrchestrateChat(request);
  }
}

export async function saveUserMessage(sessionId: string, message: string): Promise<void> {
  const messages = loadLocalMessages(sessionId);
  messages.push(createMessageRow({ session_id: sessionId, role: 'user', content: message }));
  saveLocalMessages(sessionId, messages);
}

export async function saveAssistantMessage(
  sessionId: string,
  userMessage: string,
  responses: AspectResponse[],
  modelUsed: string,
  toolCalls: ToolCallRecord[] = []
): Promise<void> {
  const messages = loadLocalMessages(sessionId);
  messages.push(
    createMessageRow({
      session_id: sessionId,
      role: 'assistant',
      content: userMessage,
      aspect_responses: responses,
      model_used: modelUsed,
      tool_calls: toolCalls,
    })
  );
  saveLocalMessages(sessionId, messages);
}

export async function getMessages(sessionId: string): Promise<MessageRow[]> {
  try {
    const sessionHistory = await remoteAPI.getSessionHistory(sessionId);
    return sessionHistory.history.map((entry) => ({
      id: `history_${entry.timestamp}`,
      session_id: sessionId,
      user_id: 'remote',
      role: 'assistant',
      content: entry.user_message,
      aspect_responses: Object.entries(entry.responses).map(([aspect, response]) => ({
        aspect,
        response,
        model_used: 'remote',
        tool_calls: [],
        confidence: 0.6,
        timestamp: entry.timestamp,
      })),
      model_used: null,
      tool_calls: [],
      created_at: entry.timestamp,
    }));
  } catch {
    return loadLocalMessages(sessionId);
  }
}

export async function logToolCall(
  _tool: string,
  _input: Record<string, unknown>,
  _output: unknown,
  _status: 'pending' | 'running' | 'success' | 'error',
  _duration_ms: number | null,
  _messageId: string | null = null
): Promise<void> {
  // Local fallback does not persist per-message tool call metadata.
  return;
}

export async function seedUserDefaults(): Promise<void> {
  return;
}
