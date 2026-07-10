/*
# Seed Default Models, Aspects, and Tools for New Users

## Overview
Creates a database function `seed_user_defaults` that populates default model configs,
aspects (Logic, Creative, Analytical), and built-in tool definitions for a newly
registered user. Called from the app after signup.

## Changes
- Creates `seed_user_defaults(p_user_id uuid)` function
- Inserts 18 SOTA model configs across 7 providers (OpenAI, Anthropic, Gemini,
  OpenRouter, Ollama, Nous Portal/Hermes, HuggingFace)
- Inserts 3 default aspects (Logic, Creative, Analytical) linked to default models
- Inserts 10 built-in tool definitions (web_crawl, web_search, github_*, fs_*)
- All scoped to the provided user_id

## Security
- Function is SECURITY DEFINER so it can insert rows on behalf of the user
- Only inserts rows owned by the provided user_id
*/

CREATE OR REPLACE FUNCTION seed_user_defaults(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Model configs
  INSERT INTO model_configs (user_id, provider, model_id, display_name, api_base_url, api_key_ref, parameters, capabilities, enabled, sort_order)
  VALUES
    (p_user_id, 'openai', 'gpt-4o', 'GPT-4o', 'https://api.openai.com/v1', 'OPENAI_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 1),
    (p_user_id, 'openai', 'gpt-4o-mini', 'GPT-4o Mini', 'https://api.openai.com/v1', 'OPENAI_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 2),
    (p_user_id, 'anthropic', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 'https://api.anthropic.com/v1', 'ANTHROPIC_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 3),
    (p_user_id, 'anthropic', 'claude-3-5-haiku-20241022', 'Claude 3.5 Haiku', 'https://api.anthropic.com/v1', 'ANTHROPIC_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 4),
    (p_user_id, 'gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', 'https://generativelanguage.googleapis.com/v1beta', 'GEMINI_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 5),
    (p_user_id, 'gemini', 'gemini-1.5-flash', 'Gemini 1.5 Flash', 'https://generativelanguage.googleapis.com/v1beta', 'GEMINI_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 6),
    (p_user_id, 'openrouter', 'auto', 'OpenRouter Auto', 'https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 7),
    (p_user_id, 'openrouter', 'anthropic/claude-3.5-sonnet', 'OR Claude 3.5 Sonnet', 'https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 8),
    (p_user_id, 'openrouter', 'openai/gpt-4o', 'OR GPT-4o', 'https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 9),
    (p_user_id, 'openrouter', 'google/gemini-flash-1.5', 'OR Gemini Flash', 'https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 10),
    (p_user_id, 'openrouter', 'meta-llama/llama-3.3-70b-instruct', 'OR Llama 3.3 70B', 'https://openrouter.ai/api/v1', 'OPENROUTER_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 11),
    (p_user_id, 'ollama', 'llama3.1', 'Ollama Llama 3.1', 'http://localhost:11434', '',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": false, "streaming": true}'::jsonb, true, 12),
    (p_user_id, 'ollama', 'qwen2.5', 'Ollama Qwen 2.5', 'http://localhost:11434', '',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": false, "streaming": true}'::jsonb, true, 13),
    (p_user_id, 'ollama', 'hermes3', 'Ollama Hermes 3', 'http://localhost:11434', '',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": false, "streaming": true}'::jsonb, true, 14),
    (p_user_id, 'nous_portal', 'Hermes-3-Llama-3.1-405B', 'Nous Hermes 3 405B', 'https://api.nousresearch.com/v1', 'NOUS_PORTAL_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 15),
    (p_user_id, 'nous_portal', 'Hermes-3-Llama-3.1-70B', 'Nous Hermes 3 70B', 'https://api.nousresearch.com/v1', 'NOUS_PORTAL_API_KEY',
     '{"temperature": 0.7, "max_tokens": 4096}'::jsonb, '{"tool_calling": true, "streaming": true}'::jsonb, true, 16),
    (p_user_id, 'huggingface', 'meta-llama/Llama-3.2-3B-Instruct', 'HF Llama 3.2 3B', 'https://api-inference.huggingface.co/models', 'HF_API_TOKEN',
     '{"temperature": 0.7, "max_tokens": 1024}'::jsonb, '{"tool_calling": false, "streaming": false}'::jsonb, true, 17),
    (p_user_id, 'huggingface', 'mistralai/Mistral-7B-Instruct-v0.3', 'HF Mistral 7B', 'https://api-inference.huggingface.co/models', 'HF_API_TOKEN',
     '{"temperature": 0.7, "max_tokens": 1024}'::jsonb, '{"tool_calling": false, "streaming": false}'::jsonb, true, 18)
  ON CONFLICT DO NOTHING;

  -- Default aspects
  INSERT INTO aspects (user_id, name, description, system_prompt, model_config_id, color, icon, sort_order, enabled)
  SELECT p_user_id, 'Logic', 'Logical reasoning and structured problem-solving',
    'You are a logical, analytical AI focused on reasoning and problem-solving. Provide clear, structured responses.',
    mc.id, '#3b82f6', 'MessageSquare', 1, true
  FROM model_configs mc
  WHERE mc.user_id = p_user_id AND mc.model_id = 'gpt-4o'
  ON CONFLICT DO NOTHING;

  INSERT INTO aspects (user_id, name, description, system_prompt, model_config_id, color, icon, sort_order, enabled)
  SELECT p_user_id, 'Creative', 'Creative insights and imaginative thinking',
    'You are a creative, imaginative AI. Think outside the box and provide innovative, artistic responses.',
    mc.id, '#8b5cf6', 'Sparkles', 2, true
  FROM model_configs mc
  WHERE mc.user_id = p_user_id AND mc.model_id = 'gpt-4o'
  ON CONFLICT DO NOTHING;

  INSERT INTO aspects (user_id, name, description, system_prompt, model_config_id, color, icon, sort_order, enabled)
  SELECT p_user_id, 'Analytical', 'Data-driven analysis and pattern recognition',
    'You are an analytical AI focused on data, patterns, and structured analysis. Provide detailed, methodical responses.',
    mc.id, '#10b981', 'BarChart3', 3, true
  FROM model_configs mc
  WHERE mc.user_id = p_user_id AND mc.model_id = 'gpt-4o'
  ON CONFLICT DO NOTHING;

  -- Built-in tool definitions
  INSERT INTO tool_definitions (user_id, name, description, parameters_schema, source, enabled)
  VALUES
    (p_user_id, 'web_crawl', 'Crawl a URL and extract text content, links, and metadata',
     '{"type": "object", "properties": {"url": {"type": "string", "description": "The URL to crawl"}, "extract_mode": {"type": "string", "enum": ["text", "links", "metadata", "full"], "default": "text"}, "max_depth": {"type": "integer", "default": 1}}, "required": ["url"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'web_search', 'Search the web and return top results with summaries',
     '{"type": "object", "properties": {"query": {"type": "string", "description": "Search query"}, "max_results": {"type": "integer", "default": 5}}, "required": ["query"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'github_search_repos', 'Search GitHub repositories',
     '{"type": "object", "properties": {"query": {"type": "string"}, "sort": {"type": "string", "enum": ["stars", "forks", "updated"], "default": "stars"}}, "required": ["query"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'github_get_file', 'Get file contents from a GitHub repository',
     '{"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "path": {"type": "string"}, "branch": {"type": "string", "default": "main"}}, "required": ["owner", "repo", "path"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'github_get_readme', 'Get the README of a GitHub repository',
     '{"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}}, "required": ["owner", "repo"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'github_list_issues', 'List issues in a GitHub repository',
     '{"type": "object", "properties": {"owner": {"type": "string"}, "repo": {"type": "string"}, "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"}, "limit": {"type": "integer", "default": 10}}, "required": ["owner", "repo"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'fs_read_file', 'Read a file from the sandboxed filesystem',
     '{"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'fs_write_file', 'Write a file in the sandboxed filesystem',
     '{"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'fs_list_directory', 'List files in a directory in the sandboxed filesystem',
     '{"type": "object", "properties": {"path": {"type": "string", "default": "."}}, "required": ["path"]}'::jsonb,
     'builtin', true),
    (p_user_id, 'fs_search_files', 'Search for files by name pattern in the sandboxed filesystem',
     '{"type": "object", "properties": {"pattern": {"type": "string"}}, "required": ["pattern"]}'::jsonb,
     'builtin', true)
  ON CONFLICT DO NOTHING;
END;
$$;
