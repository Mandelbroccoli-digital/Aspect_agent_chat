import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ModelConfig {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  api_base_url: string;
  api_key_ref: string;
  parameters: Record<string, unknown>;
  capabilities: { tool_calling: boolean; streaming: boolean };
}

interface AspectConfig {
  id: string;
  name: string;
  system_prompt: string;
  model_config_id: string;
}

interface ToolDef {
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
}

interface ChatRequest {
  message: string;
  session_id: string;
  aspects: string[];
  history: { role: string; content: string }[];
  model_configs: ModelConfig[];
  aspect_configs: AspectConfig[];
  tools: ToolDef[];
  tool_calling_enabled: boolean;
}

interface AspectResult {
  aspect: string;
  response: string;
  model_used: string;
  tool_calls: { tool: string; input: Record<string, unknown>; output: unknown }[];
  confidence: number;
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ChatRequest = await req.json();
    const {
      message,
      aspects: aspectNames,
      history,
      model_configs,
      aspect_configs,
      tools,
      tool_calling_enabled,
    } = body;

    const results: AspectResult[] = [];

    for (const aspectName of aspectNames) {
      const aspectConfig = aspect_configs.find((a) => a.name === aspectName);
      if (!aspectConfig) {
        results.push({
          aspect: aspectName,
          response: `Aspect "${aspectName}" not found.`,
          model_used: "none",
          tool_calls: [],
          confidence: 0,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      const modelConfig = model_configs.find((m) => m.id === aspectConfig.model_config_id);
      if (!modelConfig) {
        results.push({
          aspect: aspectName,
          response: `No model assigned to aspect "${aspectName}". Please assign a model in the Aspect Manager.`,
          model_used: "none",
          tool_calls: [],
          confidence: 0,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      try {
        const result = await callModel(
          modelConfig,
          aspectConfig,
          message,
          history,
          tool_calling_enabled && modelConfig.capabilities.tool_calling ? tools : [],
          req
        );
        results.push(result);
      } catch (err) {
        results.push({
          aspect: aspectName,
          response: `Error calling ${modelConfig.display_name}: ${err.message}`,
          model_used: modelConfig.model_id,
          tool_calls: [],
          confidence: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return new Response(
      JSON.stringify({ responses: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callModel(
  model: ModelConfig,
  aspect: AspectConfig,
  message: string,
  history: { role: string; content: string }[],
  tools: ToolDef[],
  _req: Request
): Promise<AspectResult> {
  const apiKey = Deno.env.get(model.api_key_ref) || "";
  const baseUrl = model.api_base_url;
  const params = model.parameters as { temperature?: number; max_tokens?: number };

  const systemPrompt = aspect.system_prompt;
  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const toolCalls: { tool: string; input: Record<string, unknown>; output: unknown }[] = [];

  let responseText = "";
  let maxIterations = 5;

  while (maxIterations > 0) {
    maxIterations--;

    let apiResponse: Response;

    if (model.provider === "anthropic") {
      apiResponse = await callAnthropic(baseUrl, apiKey, model.model_id, messages, params, tools);
    } else if (model.provider === "gemini") {
      apiResponse = await callGemini(baseUrl, apiKey, model.model_id, messages, params, tools);
    } else {
      apiResponse = await callOpenAICompatible(baseUrl, apiKey, model.model_id, messages, params, tools);
    }

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`${apiResponse.status}: ${errText}`);
    }

    const data = await apiResponse.json();

    if (model.provider === "anthropic") {
      const content = data.content || [];
      const textBlocks = content.filter((b: { type: string }) => b.type === "text");
      const toolUseBlocks = content.filter((b: { type: string }) => b.type === "tool_use");

      responseText = textBlocks.map((b: { text: string }) => b.text).join("");

      if (toolUseBlocks.length > 0 && tools.length > 0) {
        for (const tu of toolUseBlocks) {
          const toolResult = await executeTool(tu.name, tu.input, _req);
          toolCalls.push({ tool: tu.name, input: tu.input, output: toolResult });
          messages.push({ role: "assistant", content: JSON.stringify(content) });
          messages.push({
            role: "user",
            content: JSON.stringify({ tool_result: toolResult, tool_use_id: tu.id }),
          });
        }
        continue;
      }
      break;
    } else if (model.provider === "gemini") {
      const candidates = data.candidates || [];
      const parts = candidates[0]?.content?.parts || [];
      const textParts = parts.filter((p: { text?: string }) => p.text);
      const functionCallParts = parts.filter((p: { functionCall?: unknown }) => p.functionCall);

      responseText = textParts.map((p: { text: string }) => p.text).join("");

      if (functionCallParts.length > 0 && tools.length > 0) {
        for (const fc of functionCallParts) {
          const fnCall = fc.functionCall as { name: string; args: Record<string, unknown> };
          const toolResult = await executeTool(fnCall.name, fnCall.args, _req);
          toolCalls.push({ tool: fnCall.name, input: fnCall.args, output: toolResult });
          messages.push({
            role: "function",
            content: JSON.stringify({ name: fnCall.name, response: toolResult }),
          });
        }
        continue;
      }
      break;
    } else {
      const choice = data.choices?.[0];
      const msg = choice?.message;
      responseText = msg?.content || "";

      if (msg?.tool_calls && tools.length > 0) {
        for (const tc of msg.tool_calls) {
          const toolInput = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
          const toolResult = await executeTool(tc.function.name, toolInput, _req);
          toolCalls.push({ tool: tc.function.name, input: toolInput, output: toolResult });
          messages.push({
            role: "assistant",
            content: responseText || "",
          });
          messages.push({
            role: "tool",
            content: JSON.stringify(toolResult),
          });
        }
        continue;
      }
      break;
    }
  }

  return {
    aspect: aspect.name,
    response: responseText,
    model_used: model.model_id,
    tool_calls: toolCalls,
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  };
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[],
  params: { temperature?: number; max_tokens?: number },
  tools: ToolDef[]
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: modelId,
    messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 1024,
  };

  if (tools.length > 0) {
    body.tools = tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters_schema,
      },
    }));
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[],
  params: { temperature?: number; max_tokens?: number },
  tools: ToolDef[]
): Promise<Response> {
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model: modelId,
    messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: params.max_tokens ?? 1024,
    temperature: params.temperature ?? 0.7,
  };

  if (systemMsg) body.system = systemMsg.content;

  if (tools.length > 0) {
    body.tools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters_schema,
    }));
  }

  return fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

async function callGemini(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[],
  params: { temperature?: number; max_tokens?: number },
  tools: ToolDef[]
): Promise<Response> {
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    contents: nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.max_tokens ?? 1024,
    },
  };

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  if (tools.length > 0) {
    body.tools = [{
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters_schema,
      })),
    }];
  }

  return fetch(`${baseUrl}/${modelId}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  req: Request
): Promise<unknown> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authHeader = req.headers.get("Authorization") || "";

    const response = await fetch(`${supabaseUrl}/functions/v1/tool-executor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Client-Info": "chat-orchestrator",
        Apikey: anonKey,
      },
      body: JSON.stringify({ tool_name: toolName, input }),
    });

    if (!response.ok) {
      return { error: `Tool execution failed: ${response.status}` };
    }
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}
