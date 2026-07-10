export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'ollama'
  | 'nous_portal'
  | 'huggingface'
  | 'custom';

export interface ModelConfig {
  id: string;
  user_id: string;
  provider: ModelProvider;
  model_id: string;
  display_name: string;
  api_base_url?: string;
  api_key_ref: string;
  parameters: { temperature: number; max_tokens: number; [k: string]: unknown };
  capabilities: { tool_calling: boolean; streaming: boolean };
  enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface AspectConfig {
  id: string;
  user_id: string;
  name: string;
  description: string;
  system_prompt: string;
  model_config_id: string | null;
  color: string;
  icon: string;
  sort_order: number;
  enabled: boolean;
  created_at: string;
}

export interface ToolDefinition {
  id: string;
  user_id: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  source: 'builtin' | 'mcp' | 'github' | 'filesystem' | 'web';
  connection_id?: string | null;
  enabled: boolean;
  created_at: string;
}

export interface ToolCallLog {
  id: string;
  user_id: string;
  message_id: string | null;
  tool_name: string;
  input: Record<string, unknown>;
  output: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
  duration_ms: number | null;
  created_at: string;
}

export interface Connection {
  id: string;
  user_id: string;
  type: 'mcp' | 'github' | 'filesystem' | 'web';
  name: string;
  config: Record<string, unknown>;
  status: 'connected' | 'disconnected' | 'error';
  last_connected_at?: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  aspect_responses: AspectResponse[];
  model_used: string | null;
  tool_calls: ToolCallRecord[];
  created_at: string;
}

export interface AspectResponse {
  aspect: string;
  response: string;
  model_used: string;
  tool_calls: ToolCallRecord[];
  confidence: number;
  timestamp: string;
}

export interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'aspects';
  content: string;
  timestamp: Date;
  aspects?: AspectResponse[];
}

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
  nous_portal: 'Nous Portal',
  huggingface: 'Hugging Face',
  custom: 'Custom',
};

export const PROVIDER_COLORS: Record<ModelProvider, string> = {
  openai: '#10a37f',
  anthropic: '#d4a27f',
  gemini: '#4285f4',
  openrouter: '#6366f1',
  ollama: '#000000',
  nous_portal: '#ff6b35',
  huggingface: '#ff9d00',
  custom: '#64748b',
};
