---
name: multi-perspective-orchestrator
description: Build multi-perspective AI chat systems where a single user query is answered simultaneously by multiple AI "aspects" (Logic, Creative, Analytical, or custom), each backed by a different model provider with independent tool calling. Use whenever the user asks to build a multi-agent chat, multi-perspective AI, aspect-based reasoning system, or any app where one prompt gets parallel responses from different models with different system prompts.
---

# Multi-Perspective Orchestrator

Build chat systems where one user message triggers parallel responses from multiple AI agents (aspects), each with its own model, system prompt, and tool access. The user sees all perspectives side by side in columns.

## Architecture

### Database (Supabase)

Create these tables with RLS scoped to `auth.uid()`:

- `sessions` - Chat sessions (id, user_id, title, created_at, updated_at)
- `messages` - Messages with `aspect_responses` as JSONB array
- `model_configs` - Provider configs (provider, model_id, display_name, api_base_url, api_key_ref, parameters, capabilities)
- `aspects` - User-defined perspectives (name, system_prompt, model_config_id, color, icon)
- `tool_definitions` - Registered tools (name, description, parameters_schema, source)
- `tool_call_logs` - Audit log of every tool invocation
- `connections` - External integrations (MCP, GitHub, filesystem, web)

Use a `seed_user_defaults()` SECURITY DEFINER function to populate default models and aspects on signup. The FK constraint on `user_id` prevents sentinel-UUID seeding — use the function instead.

### Edge Functions

Two edge functions handle the heavy lifting:

1. **chat-orchestrator** - Receives the user message, aspect configs, model configs, and tool definitions. For each aspect, calls the assigned model via the provider's API format (OpenAI-compatible, Anthropic, or Gemini). If the model supports tool calling and tools are enabled, sends tool definitions with the prompt, executes requested tools, and feeds results back (up to 5 iterations).

2. **tool-executor** - Dispatches tool execution by tool name. Built-in tools: web_crawl, web_search, github_* (search, get_file, get_readme, list_issues), fs_* (read, write, list, search). All filesystem operations are sandboxed with path traversal prevention.

### Frontend

- **AuthScreen** - Supabase email/password sign-up and sign-in
- **Sidebar** - Tabbed panels for Sessions, Models, Aspects, Tools, Connections
- **ChatInterface** - Horizontal aspect columns, each with a model selector dropdown in the header
- **AspectChatColumn** - Renders responses for one aspect with inline tool-call cards (collapsible)

## Provider Support

Support these providers with their API formats:

- **OpenAI** (OpenAI-compatible `/chat/completions`): GPT-4o, GPT-4o-mini
- **Anthropic** (`/messages` with `x-api-key` header): Claude 3.5 Sonnet, Haiku
- **Gemini** (`:generateContent?key=`): Gemini 1.5 Pro, Flash
- **OpenRouter** (OpenAI-compatible): Auto, Claude, GPT-4o, Llama 3.3, Gemini Flash
- **Ollama** (OpenAI-compatible, local/cloud): Llama 3.1, Qwen 2.5, Hermes 3
- **Nous Portal** (OpenAI-compatible): Hermes 3 405B, Hermes 3 70B
- **Hugging Face** (Inference API): Llama 3.2 3B, Mistral 7B

API keys are stored as Supabase Edge Function secrets (referenced by `api_key_ref`), never exposed to the client.

## Tool Calling Flow

1. Orchestrator calls the model with tool definitions attached
2. Model responds with a tool call request (format varies by provider)
3. Orchestrator sends the tool call to the tool-executor edge function
4. Tool-executor dispatches to the appropriate handler (web, GitHub, filesystem)
5. Result is fed back to the model
6. Model generates final response
7. All tool calls are logged and rendered as collapsible cards in the UI

For Anthropic, tool calls come as `tool_use` content blocks. For Gemini, they come as `functionCall` parts. For OpenAI-compatible, they come as `tool_calls` in the message. Handle all three formats.

## Key Patterns

- **Per-aspect model selection**: Each aspect column has a dropdown to switch models at runtime. The selection persists to the `aspects.model_config_id` column.
- **Custom aspects**: Users create aspects with their own name, system prompt, color, and assigned model.
- **Tool toggling**: Global tool-calling toggle in the header. Per-tool enable/disable in the Tools tab.
- **Connection management**: MCP servers, GitHub tokens, and filesystem roots are managed as `connections` entries. MCP tools are auto-discovered and registered.
- **Session persistence**: All messages are stored in Supabase and loaded on session switch.

## What "Done Right" Looks Like

A user signs up, sees three default aspect columns (Logic, Creative, Analytical), each with GPT-4o pre-assigned. They type a question and see three parallel responses. They switch the Creative aspect to Claude 3.5 Sonnet via the dropdown. They enable tool calling and ask a question that triggers a web crawl — the tool call appears as a collapsible card under the response showing the URL, input, and extracted content. They create a custom "Security" aspect with a red color and assign it Hermes 3 via Nous Portal. Everything persists across page reloads.
