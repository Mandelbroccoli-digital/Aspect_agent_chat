import React, { useState } from 'react';
import { MessageSquare, Sparkles, ChartBar as BarChart3, Loader as Loader2, ChevronDown, Wrench, Cpu, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';
import type { AspectResponse, ModelConfig, AspectConfig } from '../services/types';
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../services/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  MessageSquare,
  Sparkles,
  BarChart3,
};

interface ToolCallCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
}

function ToolCallCard({ toolName, input, output }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-slate-700/50 bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 transition-colors"
      >
        <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-xs font-mono text-amber-300 flex-1 text-left">{toolName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Input</p>
            <pre className="text-xs text-slate-300 bg-slate-950/50 rounded p-2 overflow-x-auto font-mono">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Output</p>
            <pre className="text-xs text-slate-300 bg-slate-950/50 rounded p-2 overflow-x-auto font-mono max-h-48">
              {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface ModelSelectorProps {
  aspect: AspectConfig;
  models: ModelConfig[];
  onModelChange: (modelConfigId: string) => void;
}

function ModelSelector({ aspect, models, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const currentModel = models.find((m) => m.id === aspect.model_config_id);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-xs"
      >
        <Cpu className="w-3 h-3" />
        <span className="text-white/90 max-w-[120px] truncate">
          {currentModel ? currentModel.display_name : 'No model'}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl min-w-[240px] max-h-64 overflow-y-auto">
            {models.filter((m) => m.enabled).map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors text-left"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PROVIDER_COLORS[model.provider] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{model.display_name}</p>
                  <p className="text-[10px] text-slate-400">{PROVIDER_LABELS[model.provider]}</p>
                </div>
                {model.capabilities.tool_calling && (
                  <Wrench className="w-3 h-3 text-amber-400 flex-shrink-0" />
                )}
                {model.id === aspect.model_config_id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface AspectChatColumnProps {
  aspect: AspectConfig;
  responses: AspectResponse[];
  isLoading: boolean;
  models: ModelConfig[];
  onModelChange: (modelConfigId: string) => void;
}

export function AspectChatColumn({
  aspect,
  responses,
  isLoading,
  models,
  onModelChange,
}: AspectChatColumnProps) {
  const Icon = ICON_MAP[aspect.icon] || MessageSquare;

  return (
    <div className="flex flex-col h-full bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${aspect.color}30, ${aspect.color}10)`,
          borderBottom: `1px solid ${aspect.color}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: aspect.color }} />
          <h3 className="text-sm font-semibold text-white">{aspect.name}</h3>
        </div>
        <ModelSelector aspect={aspect} models={models} onModelChange={onModelChange} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {responses.map((response, index) => (
          <div
            key={`${response.aspect}-${index}`}
            className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/30"
          >
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {response.response}
            </p>

            {response.tool_calls && response.tool_calls.length > 0 && (
              <div className="space-y-1">
                {response.tool_calls.map((tc, tcIdx) => (
                  <ToolCallCard
                    key={tcIdx}
                    toolName={tc.tool}
                    input={tc.input}
                    output={tc.output}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
              <span className="text-slate-500 text-[10px]">
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[10px] font-mono">{response.model_used}</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        response.confidence > 0.7
                          ? '#4ade80'
                          : response.confidence > 0.4
                            ? '#facc15'
                            : '#f87171',
                    }}
                  />
                  <span className="text-slate-500 text-[10px]">
                    {Math.round(response.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center py-4 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {responses.length === 0 && !isLoading && (
          <div className="text-center text-slate-600 text-sm py-8">
            <Icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Start a conversation to see {aspect.name.toLowerCase()} perspectives</p>
          </div>
        )}
      </div>
    </div>
  );
}
