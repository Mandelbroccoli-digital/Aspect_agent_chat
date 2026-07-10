# Aspect AI

Multi-perspective AI chat platform with dynamic model selection, tool calling, and external integrations.

## Features

- **Multi-Aspect Chat**: One message gets parallel responses from multiple AI perspectives (Logic, Creative, Analytical, or custom)
- **Dynamic Model Selection**: Per-aspect model switching across 7 providers (OpenAI, Anthropic, Gemini, OpenRouter, Ollama, Nous Portal, Hugging Face)
- **Tool Calling**: Models can invoke tools (web crawling, web search, GitHub API, filesystem operations) with full input/output visibility
- **MCP Integration**: Connect to local MCP servers and auto-discover their tools
- **GitHub Integration**: Search repos, read files, list issues via GitHub API
- **Filesystem Access**: Sandboxed read/write/list/search operations
- **Session Persistence**: All conversations stored in Supabase
- **Auth**: Email/password authentication via Supabase Auth
- **AGENTS.md**: Intent proclamations for all agents

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Postgres + Edge Functions + Auth)
- **Icons**: lucide-react

## Getting Started

The dev server runs automatically. Sign up with email/password to get started. Default models, aspects, and tools are seeded automatically on signup.

## Configuration

API keys for model providers are configured as Supabase Edge Function secrets. The app references them by name (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
