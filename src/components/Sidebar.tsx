import React, { useState } from 'react';
import { Plus, Trash2, Settings, Plug, Wrench, Layers, LogOut, ChevronRight, Server, Github, FolderTree, Globe, X, Loader as Loader2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type {
  Session,
  ModelConfig,
  AspectConfig,
  ToolDefinition,
  Connection,
} from '../services/types';
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../services/types';
import {
  createSession,
  deleteSession,
  createConnection,
  deleteConnection,
  updateConnection,
  updateAspect,
  updateModelConfig,
  updateToolDefinition,
  createModelConfig,
  createAspect,
  deleteAspect,
  createToolDefinition,
  deleteToolDefinition,
} from '../services/api';

type Tab = 'sessions' | 'models' | 'aspects' | 'tools' | 'connections';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  models: ModelConfig[];
  aspects: AspectConfig[];
  tools: ToolDefinition[];
  connections: Connection[];
  onDataChange: () => void;
}

export function Sidebar(props: SidebarProps) {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('sessions');

  return (
    <div className="w-72 h-full bg-slate-900/80 border-r border-slate-700/50 flex flex-col">
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Aspect AI</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {(
            [
              ['sessions', 'Sessions', Plus],
              ['models', 'Models', Settings],
              ['aspects', 'Aspects', Layers],
              ['tools', 'Tools', Wrench],
              ['connections', 'Connect', Plug],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'sessions' && <SessionsTab {...props} />}
        {tab === 'models' && <ModelsTab {...props} />}
        {tab === 'aspects' && <AspectsTab {...props} />}
        {tab === 'tools' && <ToolsTab {...props} />}
        {tab === 'connections' && <ConnectionsTab {...props} />}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SessionsTab({ sessions, currentSessionId, onSelectSession, onNewSession, onDeleteSession }: SidebarProps) {
  return (
    <div className="p-2 space-y-1">
      <button
        onClick={onNewSession}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm transition-colors border border-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        New Session
      </button>
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            s.id === currentSessionId
              ? 'bg-slate-700/50 text-white'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
          onClick={() => onSelectSession(s.id)}
        >
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{s.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(s.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {sessions.length === 0 && (
        <p className="text-slate-600 text-xs text-center py-4">No sessions yet</p>
      )}
    </div>
  );
}

function ModelsTab({ models, onDataChange }: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [newProvider, setNewProvider] = useState<ModelConfig['provider']>('openai');
  const [newModelId, setNewModelId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBaseUrl, setNewBaseUrl] = useState('');

  const handleAdd = async () => {
    if (!newModelId || !newDisplayName) return;
    await createModelConfig({
      provider: newProvider,
      model_id: newModelId,
      display_name: newDisplayName,
      api_base_url: newBaseUrl || undefined,
      api_key_ref: '',
      parameters: { temperature: 0.7, max_tokens: 4096 },
      capabilities: { tool_calling: true, streaming: true },
      enabled: true,
      sort_order: models.length + 1,
    });
    setAdding(false);
    setNewModelId('');
    setNewDisplayName('');
    setNewBaseUrl('');
    onDataChange();
  };

  return (
    <div className="p-2 space-y-1">
      <button
        onClick={() => setAdding(!adding)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm transition-colors border border-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        Add Model
      </button>

      {adding && (
        <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700/50">
          <select
            value={newProvider}
            onChange={(e) => setNewProvider(e.target.value as ModelConfig['provider'])}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
          >
            {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <input
            placeholder="Model ID"
            value={newModelId}
            onChange={(e) => setNewModelId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <input
            placeholder="Display Name"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <input
            placeholder="API Base URL (optional)"
            value={newBaseUrl}
            onChange={(e) => setNewBaseUrl(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {models.map((m) => (
        <div key={m.id} className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PROVIDER_COLORS[m.provider] }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{m.display_name}</p>
            <p className="text-[10px] text-slate-500">{PROVIDER_LABELS[m.provider]} · {m.model_id}</p>
          </div>
          <button
            onClick={async () => {
              await updateModelConfig(m.id, { enabled: !m.enabled });
              onDataChange();
            }}
            className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
              m.enabled ? 'bg-green-500/80' : 'bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                m.enabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

function AspectsTab({ aspects, models, onDataChange }: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleAdd = async () => {
    if (!name) return;
    await createAspect({
      name,
      description: '',
      system_prompt: prompt || `You are a ${name.toLowerCase()} AI.`,
      model_config_id: models[0]?.id || null,
      color,
      icon: 'MessageSquare',
      sort_order: aspects.length + 1,
      enabled: true,
    });
    setAdding(false);
    setName('');
    setPrompt('');
    setColor('#3b82f6');
    onDataChange();
  };

  return (
    <div className="p-2 space-y-1">
      <button
        onClick={() => setAdding(!adding)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm transition-colors border border-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        Add Aspect
      </button>

      {adding && (
        <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700/50">
          <input
            placeholder="Aspect Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <textarea
            placeholder="System Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-slate-900 border border-slate-700"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {aspects.map((a) => (
        <div key={a.id} className="group px-3 py-2 rounded-lg hover:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: a.color }}
            />
            <span className="flex-1 text-sm text-white truncate">{a.name}</span>
            <button
              onClick={async () => {
                await deleteAspect(a.id);
                onDataChange();
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            {models.find((m) => m.id === a.model_config_id)?.display_name || 'No model'}
          </p>
        </div>
      ))}
    </div>
  );
}

function ToolsTab({ tools, onDataChange }: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [source, setSource] = useState<ToolDefinition['source']>('builtin');

  const handleAdd = async () => {
    if (!name) return;
    await createToolDefinition({
      name,
      description: desc,
      parameters_schema: {},
      source,
      enabled: true,
    });
    setAdding(false);
    setName('');
    setDesc('');
    onDataChange();
  };

  const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    builtin: Wrench,
    mcp: Server,
    github: Github,
    filesystem: FolderTree,
    web: Globe,
  };

  return (
    <div className="p-2 space-y-1">
      <button
        onClick={() => setAdding(!adding)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm transition-colors border border-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        Add Tool
      </button>

      {adding && (
        <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700/50">
          <input
            placeholder="Tool Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <input
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as ToolDefinition['source'])}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
          >
            <option value="builtin">Built-in</option>
            <option value="mcp">MCP</option>
            <option value="github">GitHub</option>
            <option value="filesystem">Filesystem</option>
            <option value="web">Web</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tools.map((t) => {
        const Icon = SOURCE_ICONS[t.source] || Wrench;
        return (
          <div key={t.id} className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/50">
            <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-mono truncate">{t.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{t.description || t.source}</p>
            </div>
            <button
              onClick={async () => {
                await updateToolDefinition(t.id, { enabled: !t.enabled });
                onDataChange();
              }}
              className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                t.enabled ? 'bg-green-500/80' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  t.enabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConnectionsTab({ connections, onDataChange }: SidebarProps) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<Connection['type']>('mcp');
  const [name, setName] = useState('');
  const [config, setConfig] = useState('{}');

  const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    mcp: Server,
    github: Github,
    filesystem: FolderTree,
    web: Globe,
  };

  const handleAdd = async () => {
    if (!name) return;
    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = JSON.parse(config);
    } catch {
      // keep empty
    }
    await createConnection({
      type,
      name,
      config: parsedConfig,
      status: 'disconnected',
    });
    setAdding(false);
    setName('');
    setConfig('{}');
    onDataChange();
  };

  return (
    <div className="p-2 space-y-1">
      <button
        onClick={() => setAdding(!adding)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-sm transition-colors border border-blue-500/20"
      >
        <Plus className="w-4 h-4" />
        Add Connection
      </button>

      {adding && (
        <div className="p-3 bg-slate-800/50 rounded-lg space-y-2 border border-slate-700/50">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Connection['type'])}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
          >
            <option value="mcp">MCP Server</option>
            <option value="github">GitHub</option>
            <option value="filesystem">Filesystem</option>
            <option value="web">Web API</option>
          </select>
          <input
            placeholder="Connection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600"
          />
          <textarea
            placeholder='Config JSON (e.g. {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]})'
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 resize-none font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {connections.map((c) => {
        const Icon = TYPE_ICONS[c.type] || Plug;
        return (
          <div key={c.id} className="group px-3 py-2 rounded-lg hover:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-sm text-white truncate">{c.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  c.status === 'connected'
                    ? 'bg-green-500/20 text-green-300'
                    : c.status === 'error'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {c.status}
              </span>
              <button
                onClick={async () => {
                  await deleteConnection(c.id);
                  onDataChange();
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">{c.type}</p>
          </div>
        );
      })}
      {connections.length === 0 && (
        <p className="text-slate-600 text-xs text-center py-4">
          No connections configured.
          <br />
          Add MCP servers, GitHub tokens, or filesystem roots.
        </p>
      )}
    </div>
  );
}
