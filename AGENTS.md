# AGENTS.md - Aspect AI Agent Intent Proclamations

## Purpose
This document declares the intent, capabilities, and operational guidelines for
all AI agents operating within the Aspect AI platform. Each agent (aspect) is
configured with a specific model, system prompt, and tool access, and this file
serves as the canonical reference for agent behavior.

---

## Core Agent Principles

1. **Multi-Perspective by Design**: Every query is processed by multiple agents
   simultaneously, each offering a distinct perspective (Logic, Creative,
   Analytical, or user-defined aspects).

2. **Model Sovereignty**: Each agent is bound to a specific model configuration.
   The model determines the agent's reasoning style, token limits, and tool-calling
   capabilities. Users can reassign models per aspect at any time.

3. **Tool Transparency**: All tool calls are visible to the user. Tool invocations
   are logged with full input/output records and rendered inline in the chat UI.

4. **Sandboxed Execution**: Filesystem operations are constrained to a sandbox
   root directory. Web crawling respects rate limits and caches results. GitHub
   operations use authenticated tokens stored as secrets.

5. **Intent Proclamation**: Before executing any tool, the agent's intent is
   visible in the response stream. Users can see which tool was called, with what
   parameters, and what result was returned.

---

## Default Aspects

### Logic Agent
- **Intent**: Provide structured, logical reasoning and problem-solving.
- **Default Model**: GPT-4o (OpenAI)
- **System Prompt**: "You are a logical, analytical AI focused on reasoning and
  problem-solving. Provide clear, structured responses."
- **Color**: Blue (#3b82f6)
- **Tool Access**: All enabled tools

### Creative Agent
- **Intent**: Generate imaginative, innovative, and artistic responses.
- **Default Model**: GPT-4o (OpenAI)
- **System Prompt**: "You are a creative, imaginative AI. Think outside the box
  and provide innovative, artistic responses."
- **Color**: Violet (#8b5cf6)
- **Tool Access**: All enabled tools

### Analytical Agent
- **Intent**: Perform data-driven analysis, pattern recognition, and structured
  methodology.
- **Default Model**: GPT-4o (OpenAI)
- **System Prompt**: "You are an analytical AI focused on data, patterns, and
  structured analysis. Provide detailed, methodical responses."
- **Color**: Green (#10b981)
- **Tool Access**: All enabled tools

---

## Custom Aspects
Users can create custom aspects with:
- A unique name and description
- A custom system prompt declaring the agent's intent
- A color and icon for visual identification
- An assigned model from any configured provider
- Sort order for column display

---

## Supported Model Providers

| Provider | Key Models | Tool Calling | Streaming |
|----------|-----------|--------------|-----------|
| OpenAI | GPT-4o, GPT-4o-mini | Yes | Yes |
| Anthropic | Claude 3.5 Sonnet, Haiku | Yes | Yes |
| Google Gemini | 1.5 Pro, Flash | Yes | Yes |
| OpenRouter | Auto, Claude, GPT-4o, Llama 3.3 | Yes | Yes |
| Ollama | Llama 3.1, Qwen 2.5, Hermes 3 | No* | Yes |
| Nous Portal | Hermes 3 405B, Hermes 3 70B | Yes | Yes |
| Hugging Face | Llama 3.2 3B, Mistral 7B | No | No |

*Ollama tool calling depends on model capabilities and local configuration.

---

## Tool Registry

### Built-in Tools
- `web_crawl` - Crawl a URL, extract text/links/metadata
- `web_search` - Search the web via DuckDuckGo
- `github_search_repos` - Search GitHub repositories
- `github_get_file` - Get file contents from a GitHub repo
- `github_get_readme` - Get a repo's README
- `github_list_issues` - List issues in a GitHub repo
- `fs_read_file` - Read a file from the sandbox
- `fs_write_file` - Write a file in the sandbox
- `fs_list_directory` - List directory contents
- `fs_search_files` - Search files by glob pattern

### MCP-Discovered Tools
When an MCP server connection is established, its tools are automatically
discovered and registered in the tool registry. MCP tools are proxied through
the MCP client connection at execution time.

### Connection-Sourced Tools
GitHub and filesystem connections can register additional tools based on the
connection configuration (e.g., specific repos, specific directories).

---

## Tool Calling Flow

1. User sends a message to the chat orchestrator
2. For each enabled aspect, the orchestrator calls the assigned model
3. If the model supports tool calling and tools are enabled:
   a. Tool definitions are sent with the prompt
   b. Model may request tool execution
   c. Orchestrator executes the requested tool via the tool-executor edge function
   d. Tool result is fed back to the model
   e. Model generates final response (up to 5 tool-call iterations)
4. All tool calls are logged to the `tool_call_logs` table
5. Responses (including tool call records) are rendered in the UI

---

## Security Model

- All data is user-scoped via Supabase RLS (auth.uid() = user_id)
- API keys are stored as Supabase Edge Function secrets, never exposed to the client
- Filesystem operations are sandboxed to a configurable root directory
- Path traversal is prevented via normalized path validation
- GitHub tokens are stored as secrets and proxied through edge functions
- MCP server connections store command/URL in the database but execute via the backend

---

## Agent Skill: Multi-Perspective Orchestrator

This project includes a reusable skill that captures the workflow for building
multi-perspective AI chat systems with dynamic model selection and tool calling.
See the skill definition for implementation details.
