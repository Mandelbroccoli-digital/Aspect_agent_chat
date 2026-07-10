/*
# Aspect AI - Core Schema

## Overview
Creates the full database schema for Aspect AI, a multi-perspective AI chat platform
with dynamic model selection, tool calling, and external integrations (MCP, GitHub,
filesystem, web crawling).

## New Tables
1. **sessions** - Chat sessions (id, user_id, title, created_at, updated_at)
2. **messages** - Messages within sessions (id, session_id, user_id, role, content, aspect_responses JSONB, model_used, tool_calls JSONB, created_at)
3. **model_configs** - Available AI model configurations (id, user_id, provider, model_id, display_name, api_base_url, api_key_ref, parameters JSONB, capabilities JSONB, enabled, sort_order, created_at)
4. **connections** - External integrations (id, user_id, type, name, config JSONB, status, last_connected_at, created_at)
5. **aspects** - Custom aspect definitions (id, user_id, name, description, system_prompt, model_config_id, color, icon, sort_order, enabled, created_at)
6. **tool_definitions** - Registered tools (id, user_id, name, description, parameters_schema JSONB, source, connection_id, enabled, created_at)
7. **tool_call_logs** - Audit log of tool invocations (id, user_id, message_id, tool_name, input JSONB, output JSONB, status, duration_ms, created_at)
8. **crawl_cache** - Web crawl result cache (id, user_id, url_hash, url, content JSONB, fetched_at)

## Security
- RLS enabled on all tables
- All tables scoped to authenticated users via auth.uid() = user_id
- Owner columns default to auth.uid() for seamless inserts
*/

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Session',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON sessions;
CREATE POLICY "select_own_sessions" ON sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON sessions;
CREATE POLICY "insert_own_sessions" ON sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON sessions;
CREATE POLICY "update_own_sessions" ON sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON sessions;
CREATE POLICY "delete_own_sessions" ON sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL DEFAULT '',
  aspect_responses jsonb DEFAULT '[]'::jsonb,
  model_used text,
  tool_calls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Model configs table
CREATE TABLE IF NOT EXISTS model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('openai', 'anthropic', 'gemini', 'openrouter', 'ollama', 'nous_portal', 'huggingface', 'custom')),
  model_id text NOT NULL,
  display_name text NOT NULL,
  api_base_url text,
  api_key_ref text,
  parameters jsonb DEFAULT '{"temperature": 0.7, "max_tokens": 1024}'::jsonb,
  capabilities jsonb DEFAULT '{"tool_calling": false, "streaming": false}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE model_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_model_configs" ON model_configs;
CREATE POLICY "select_own_model_configs" ON model_configs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_model_configs" ON model_configs;
CREATE POLICY "insert_own_model_configs" ON model_configs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_model_configs" ON model_configs;
CREATE POLICY "update_own_model_configs" ON model_configs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_model_configs" ON model_configs;
CREATE POLICY "delete_own_model_configs" ON model_configs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mcp', 'github', 'filesystem', 'web')),
  name text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_connections" ON connections;
CREATE POLICY "select_own_connections" ON connections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_connections" ON connections;
CREATE POLICY "insert_own_connections" ON connections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_connections" ON connections;
CREATE POLICY "update_own_connections" ON connections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_connections" ON connections;
CREATE POLICY "delete_own_connections" ON connections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Aspects table
CREATE TABLE IF NOT EXISTS aspects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  model_config_id uuid REFERENCES model_configs(id) ON DELETE SET NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  icon text NOT NULL DEFAULT 'MessageSquare',
  sort_order integer DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aspects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_aspects" ON aspects;
CREATE POLICY "select_own_aspects" ON aspects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_aspects" ON aspects;
CREATE POLICY "insert_own_aspects" ON aspects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_aspects" ON aspects;
CREATE POLICY "update_own_aspects" ON aspects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_aspects" ON aspects;
CREATE POLICY "delete_own_aspects" ON aspects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Tool definitions table
CREATE TABLE IF NOT EXISTS tool_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  parameters_schema jsonb DEFAULT '{}'::jsonb,
  source text NOT NULL CHECK (source IN ('builtin', 'mcp', 'github', 'filesystem', 'web')),
  connection_id uuid REFERENCES connections(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tool_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tool_definitions" ON tool_definitions;
CREATE POLICY "select_own_tool_definitions" ON tool_definitions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tool_definitions" ON tool_definitions;
CREATE POLICY "insert_own_tool_definitions" ON tool_definitions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tool_definitions" ON tool_definitions;
CREATE POLICY "update_own_tool_definitions" ON tool_definitions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tool_definitions" ON tool_definitions;
CREATE POLICY "delete_own_tool_definitions" ON tool_definitions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Tool call logs table
CREATE TABLE IF NOT EXISTS tool_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  tool_name text NOT NULL,
  input jsonb DEFAULT '{}'::jsonb,
  output jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tool_call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tool_call_logs" ON tool_call_logs;
CREATE POLICY "select_own_tool_call_logs" ON tool_call_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tool_call_logs" ON tool_call_logs;
CREATE POLICY "insert_own_tool_call_logs" ON tool_call_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tool_call_logs" ON tool_call_logs;
CREATE POLICY "update_own_tool_call_logs" ON tool_call_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tool_call_logs" ON tool_call_logs;
CREATE POLICY "delete_own_tool_logs" ON tool_call_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Crawl cache table
CREATE TABLE IF NOT EXISTS crawl_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url_hash text NOT NULL,
  url text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, url_hash)
);

ALTER TABLE crawl_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_crawl_cache" ON crawl_cache;
CREATE POLICY "select_own_crawl_cache" ON crawl_cache FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_crawl_cache" ON crawl_cache;
CREATE POLICY "insert_own_crawl_cache" ON crawl_cache FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_crawl_cache" ON crawl_cache;
CREATE POLICY "update_own_crawl_cache" ON crawl_cache FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_crawl_cache" ON crawl_cache;
CREATE POLICY "delete_own_crawl_cache" ON crawl_cache FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_model_configs_user_id ON model_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_aspects_user_id ON aspects(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_definitions_user_id ON tool_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_call_logs_user_id ON tool_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_call_logs_message_id ON tool_call_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_cache_user_id ON crawl_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_cache_url_hash ON crawl_cache(url_hash);

-- updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sessions_updated_at ON sessions;
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
