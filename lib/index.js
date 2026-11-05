/**
 * dsh-deepseekbase
 *
 * Brings deepseekbase.com data into DeepSeek Harness.
 *
 * Tools:
 *   deepseekbase_price   — official + third-party provider prices
 *   deepseekbase_plugin  — plugin search WITH sandbox test results
 *   deepseekbase_specs   — model technical specs
 *   deepseekbase_trend   — weekly token volume trend
 *
 * Data comes from the public MCP endpoint at https://deepseekbase.com/mcp
 * (JSON-RPC 2.0 over HTTP). Read-only, no API key required.
 */

import { defineTool } from "@deepseek-ai/dsh-tools";

const MCP_ENDPOINT = "https://deepseekbase.com/mcp";
const TIMEOUT_MS = 15000;

/** Call one tool on the deepseekbase MCP server. */
async function callMcp(toolName, args, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // Abort if the harness cancels us first.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    const res = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: toolName, arguments: args || {} },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return `deepseekbase MCP returned HTTP ${res.status}. Try https://deepseekbase.com/data/ for the raw datasets.`;
    }
    const body = await res.json();
    if (body.error) {
      return `deepseekbase MCP error: ${body.error.message || JSON.stringify(body.error)}`;
    }
    const content = body.result && body.result.content;
    if (Array.isArray(content) && content.length > 0) {
      return content.map((c) => c.text || "").join("\n");
    }
    return "deepseekbase MCP returned an empty result.";
  } catch (err) {
    const reason = err && err.name === "AbortError" ? "timed out" : String(err);
    return `Could not reach deepseekbase (${reason}). The site may be temporarily unreachable.`;
  } finally {
    clearTimeout(timer);
  }
}

/** Shared output shape: a single text block. */
const TEXT_OUTPUT = {
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      text: { type: "string", required: true },
    },
  },
  render: (_args, value) => [
    { type: "text", text: (value && value.text) || "" },
  ],
};

export const name = "dsh-deepseekbase";

export const inject = ["tools", "systemPrompt"];

export function apply(ctx) {
  ctx.systemPrompt.section({
    name: "tool:deepseekbase",
    order: 120,
    text:
      "Use the deepseekbase_* tools for DeepSeek pricing, plugin discovery with sandbox " +
      "test results, model specs and token-volume trends. Data is a third-party index " +
      "(deepseekbase.com), not official DeepSeek output — cite it as such.",
  });

  // ── 1. Prices ────────────────────────────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_price",
      description:
        "Query DeepSeek model prices. Returns the official price table plus third-party " +
        "provider quotes per 1M tokens, sorted cheapest first, with quantization notes. " +
        "Use this when asked what DeepSeek costs or which provider is cheapest.",
      parameters: {
        model: {
          type: "string",
          description: "Model id or keyword, e.g. v4.1-flash. Omit for an overview.",
        },
        limit: {
          type: "number",
          description: "Maximum provider quotes to return. Defaults to 8.",
        },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const text = await callMcp(
          "price_query",
          { model: args.model || "", limit: Math.min(Number(args.limit) || 8, 30) },
          exec && exec.signal,
        );
        return { text };
      },
    }),
  );

  // ── 2. Plugins with sandbox test results ─────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_plugin",
      description:
        "Search DeepSeek Harness plugins. Returns name, category, downloads, stars, security " +
        "risk level, permissions and any known red lines. This index also runs real sandbox " +
        "install tests, so check /ecosystem/plugin-tests/ on deepseekbase.com for whether a " +
        "plugin actually installs on the current DSH version.",
      parameters: {
        query: {
          type: "string",
          description: "Keyword matched against name, description and repository.",
        },
        max_risk: {
          type: "string",
          description: "Only return plugins at or below this risk: low, medium or high.",
        },
        limit: {
          type: "number",
          description: "Maximum results. Defaults to 8.",
        },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const text = await callMcp(
          "plugin_search",
          {
            query: args.query || "",
            max_risk: args.max_risk || "",
            limit: Math.min(Number(args.limit) || 8, 40),
          },
          exec && exec.signal,
        );
        return { text };
      },
    }),
  );

  // ── 3. Model specs ───────────────────────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_specs",
      description:
        "Get DeepSeek model technical specs (layers, hidden size, context length, vocab, " +
        "MoE or Dense). Use when asked about model size, context window or VRAM fit.",
      parameters: {
        model: {
          type: "string",
          description: "Model name keyword, e.g. V4-Flash.",
        },
        limit: {
          type: "number",
          description: "Maximum rows. Defaults to 8.",
        },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const text = await callMcp(
          "model_specs",
          { model: args.model || "", limit: Math.min(Number(args.limit) || 8, 25) },
          exec && exec.signal,
        );
        return { text };
      },
    }),
  );

  // ── 4. Token volume trend ────────────────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_trend",
      description:
        "Get the weekly token volume trend for DeepSeek models on OpenRouter, with derived " +
        "per-day and per-second rates. Use when asked how much DeepSeek is actually used.",
      parameters: {},
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(_args, exec) {
        const text = await callMcp("official_resources", { kind: "sources" }, exec && exec.signal);
        // The trend lives in a dataset rather than an MCP tool; fetch it directly
        // and fall back to the official sources listing if that fails.
        try {
          const res = await fetch("https://deepseekbase.com/data/openrouter-tokens.json", {
            headers: { Accept: "application/json" },
            signal: exec && exec.signal,
          });
          if (res.ok) {
            const d = await res.json();
            const series = (d.series || [])
              .map((p) => `${p.week_of}: ${p.tokens_trillion}T`)
              .join("\n");
            const der = d.derived || {};
            return {
              text:
                "DeepSeek weekly token volume on OpenRouter\n" +
                `Latest: ${der.latest_trillion}T/week (${der.per_second_tokens} tokens/sec)\n` +
                `Growth since first point: ${der.growth_since_first_pct}%\n\n` +
                `Series:\n${series}\n\n` +
                `Source: ${d.source || "OpenRouter"} · collected ${d.verified_at || "unknown"}`,
            };
          }
        } catch {
          /* fall through to the MCP sources listing */
        }
        return { text };
      },
    }),
  );
}
