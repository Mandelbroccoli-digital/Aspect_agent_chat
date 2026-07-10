import { supabase } from './supabase';
import type {
  ModelConfig,
  AspectConfig,
  ToolDefinition,
  Connection,
  Session,
  MessageRow,
  AspectResponse,
  ToolCallRecord,
} from './types';

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL;

function edgeHeaders(token: string | null) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

// ── Sessions ──

export async function createSession(title = 'New Session'): Promise<Session> {
  const { data, error } = await supabase.from('sessions').insert({ title }).select().single();
  if (error) throw error;
  return data;
}

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function renameSession(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('sessions').update({ title }).eq('id', id);
  if (error) throw error;
}

// ── Messages ──

export async function getMessages(sessionId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveUserMessage(sessionId: string, content: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ session_id: sessionId, role: 'user', content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveAssistantMessage(
  sessionId: string,
  content: string,
  aspectResponses: AspectResponse[],
  modelUsed: string,
  toolCalls: ToolCallRecord[]
): Promise<MessageRow> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role: 'assistant',
      content,
      aspect_responses: aspectResponses,
      model_used: modelUsed,
      tool_calls: toolCalls,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Model Configs ──

export async function getModelConfigs(): Promise<ModelConfig[]> {
  const { data, error } = await supabase
    .from('model_configs')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createModelConfig(
  config: Omit<ModelConfig, 'id' | 'user_id' | 'created_at'>
): Promise<ModelConfig> {
  const { data, error } = await supabase
    .from('model_configs')
    .insert(config)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateModelConfig(
  id: string,
  updates: Partial<ModelConfig>
): Promise<void> {
  const { error } = await supabase.from('model_configs').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteModelConfig(id: string): Promise<void> {
  const { error } = await supabase.from('model_configs').delete().eq('id', id);
  if (error) throw error;
}

// ── Aspects ──

export async function getAspects(): Promise<AspectConfig[]> {
  const { data, error } = await supabase
    .from('aspects')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAspect(
  aspect: Omit<AspectConfig, 'id' | 'user_id' | 'created_at'>
): Promise<AspectConfig> {
  const { data, error } = await supabase
    .from('aspects')
    .insert(aspect)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAspect(id: string, updates: Partial<AspectConfig>): Promise<void> {
  const { error } = await supabase.from('aspects').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteAspect(id: string): Promise<void> {
  const { error } = await supabase.from('aspects').delete().eq('id', id);
  if (error) throw error;
}

// ── Tools ──

export async function getToolDefinitions(): Promise<ToolDefinition[]> {
  const { data, error } = await supabase
    .from('tool_definitions')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateToolDefinition(
  id: string,
  updates: Partial<ToolDefinition>
): Promise<void> {
  const { error } = await supabase.from('tool_definitions').update(updates).eq('id', id);
  if (error) throw error;
}

export async function createToolDefinition(
  tool: Omit<ToolDefinition, 'id' | 'user_id' | 'created_at'>
): Promise<ToolDefinition> {
  const { data, error } = await supabase
    .from('tool_definitions')
    .insert(tool)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteToolDefinition(id: string): Promise<void> {
  const { error } = await supabase.from('tool_definitions').delete().eq('id', id);
  if (error) throw error;
}

// ── Connections ──

export async function getConnections(): Promise<Connection[]> {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createConnection(
  conn: Omit<Connection, 'id' | 'user_id' | 'created_at'>
): Promise<Connection> {
  const { data, error } = await supabase
    .from('connections')
    .insert(conn)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateConnection(id: string, updates: Partial<Connection>): Promise<void> {
  const { error } = await supabase.from('connections').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteConnection(id: string): Promise<void> {
  const { error } = await supabase.from('connections').delete().eq('id', id);
  if (error) throw error;
}

// ── Tool Call Logs ──

export async function logToolCall(
  toolName: string,
  input: Record<string, unknown>,
  output: unknown,
  status: string,
  durationMs: number | null
): Promise<void> {
  await supabase.from('tool_call_logs').insert({
    tool_name: toolName,
    input,
    output,
    status,
    duration_ms: durationMs,
  });
}

// ── Chat Orchestration ──

export interface ChatOrchestrationRequest {
  message: string;
  session_id: string;
  aspects: string[];
  history: { role: string; content: string }[];
  model_configs: ModelConfig[];
  aspect_configs: AspectConfig[];
  tools: ToolDefinition[];
  tool_calling_enabled: boolean;
}

export interface ChatOrchestrationResponse {
  responses: AspectResponse[];
}

export async function orchestrateChat(
  request: ChatOrchestrationRequest
): Promise<ChatOrchestrationResponse> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token || null;

  const response = await fetch(`${EDGE_URL}/functions/v1/chat-orchestrator`, {
    method: 'POST',
    headers: edgeHeaders(token),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Chat orchestration failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ── Tool Execution ──

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token || null;

  const response = await fetch(`${EDGE_URL}/functions/v1/tool-executor`, {
    method: 'POST',
    headers: edgeHeaders(token),
    body: JSON.stringify({ tool_name: toolName, input }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Tool execution failed (${response.status}): ${errText}`);
  }

  return response.json();
}

// ── User Defaults Seeding ──

export async function seedUserDefaults(): Promise<void> {
  const { error } = await supabase.rpc('seed_user_defaults');
  if (error) throw error;
}
