/**
 * dsh-deepseekbase
 *
 * Brings deepseekbase.com data into DeepSeek Harness.
 *
 * Tools:
 *   deepseekbase_price        — official + third-party provider prices
 *   deepseekbase_plugin       — plugin search WITH sandbox test results
 *   deepseekbase_specs        — model technical specs
 *   deepseekbase_trend        — weekly token volume trend
 *   deepseekbase_test_plugin  — submit a plugin for a real sandbox install test
 *   deepseekbase_test_result  — read an existing verdict
 *   deepseekbase_quota        — remaining free test quota
 *   deepseekbase_check        — static DSHIO/T 10 conformance check
 *
 * The DSHIO standards themselves are not in this package — they live in
 * @liangjiehappy/dsh-dshio, which this package installs as a dependency.
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

export const inject = ["tools", "systemPrompt", "skills"];

export function apply(ctx) {

  // 把 DSHIO 标准知识（5 个技能）交给依赖包注册。
  // 用动态 import 因为 pnpm 严格模式下传递依赖只在包自己的 node_modules 里可见，
  // profile 层按名字解析会失败。异步执行，不阻塞工具注册。
  (async () => {
    try {
      const dshio = await import("@liangjiehappy/dsh-dshio");
      if (dshio && typeof dshio.apply === "function") dshio.apply(ctx);
    } catch {
      /* 知识包缺失时静默跳过，工具照常可用 */
    }
  })();
  ctx.systemPrompt.section({
    name: "tool:deepseekbase",
    order: 120,
    text:
      "Use the deepseekbase_* tools for DeepSeek pricing, plugin discovery with sandbox " +
      "test results, model specs and token-volume trends. Also use " +
      "deepseekbase_test_plugin to submit a plugin for a real sandbox install test and " +
      "deepseekbase_test_result to read the verdict. deepseekbase_check runs a static " +
      "DSHIO/T 10 conformance check on any plugin. Data is a third-party index " +
      "(deepseekbase.com), not official DeepSeek output — cite it as such. " +
      "The DSHIO standards themselves ship in @liangjiehappy/dsh-dshio as skills.",
  });

  // ── TESTING HELPERS ──────────────────────────────────────────────────────
  const BASE = "https://deepseekbase.com";
  const VERSIONS = ["0.2.2-rc.1", "0.2.2-alpha.3", "0.2.1-rc.5", "0.2.1-rc.4", "0.1.1-rc.2"];

  async function jfetch(url, opts, signal) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    try {
      const res = await fetch(url, Object.assign({ signal: controller.signal }, opts || {}));
      const text = await res.text();
      let body = null;
      try { body = JSON.parse(text); } catch { body = null; }
      return { status: res.status, body, text };
    } finally {
      clearTimeout(timer);
    }
  }

  function verdictLabel(v, zh) {
    const m = {
      pass: ["已测通过", "tested: pass"],
      install_failed: ["装不上", "install fails"],
      config_failed: ["挂载失败", "mount fails"],
      installs_but_not_registered: ["装了没注册", "mounts, not registered"],
      boot_failed: ["启动失败", "boot fails"],
      error: ["执行出错", "runner error"],
    };
    const x = m[v] || [v, v];
    return zh ? x[0] : x[1];
  }

  function renderTestResult(r, zh) {
    const lines = [];
    lines.push(`plugin: ${r.plugin}`);
    lines.push(`verdict: ${verdictLabel(r.verdict, zh)} (${r.verdict})`);
    if (r.dsh_version) lines.push(`dsh_version: ${r.dsh_version}`);
    if (r.tested_at) lines.push(`tested_at: ${r.tested_at}`);
    if (r.install_ok !== undefined && r.install_ok !== null) lines.push(`install_ok: ${r.install_ok}`);
    if (r.node_modules_mb != null) lines.push(`node_modules: ${r.node_modules_mb} MB`);
    if (r.install_sec != null) lines.push(`install_time: ${r.install_sec}s`);
    if (r.error) lines.push(`first_error: ${r.error}`);
    lines.push("");
    lines.push(`Details: ${BASE}/plugins/${r.slug || ""}`);
    return lines.join("\n");
  }

  // ── 5. Submit a plugin for testing ───────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_test_plugin",
      description:
        "Submit a DSH plugin to deepseekbase's sandbox for a real four-stage install test " +
        "(install → list → mount → boot). Free tier: 3 tests per IP per day. Returns a queue id " +
        "and the remaining quota. Use when the user asks to test whether their plugin installs. " +
        "After the run finishes, call deepseekbase_test_result to read the verdict.",
      parameters: {
        plugin: {
          type: "string",
          required: true,
          description:
            "npm package name (e.g. dsh-pet, @scope/name) or github:owner/repo.",
        },
        dsh_version: {
          type: "string",
          description:
            "DSH version to test on. Defaults to 0.2.2-rc.1. Allowed: " +
            VERSIONS.join(", "),
        },
        note: {
          type: "string",
          description: "Optional note (max 300 chars), e.g. what you installed alongside.",
        },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const ver = (args.dsh_version || "0.2.2-rc.1").trim();
        if (!VERSIONS.includes(ver)) {
          return {
            text:
              `Unsupported dsh_version "${ver}". Allowed: ${VERSIONS.join(", ")}.`,
          };
        }
        const plugin = (args.plugin || "").trim();
        if (!plugin) return { text: "plugin is required." };

        // ── 提交前先确认包存在，避免浪费免费额度 ──
        if (!plugin.startsWith("github:")) {
          const regUrl =
            "https://registry.npmjs.org/" +
            plugin.replace("/", "%2F");
          const chk = await jfetch(regUrl, {}, exec && exec.signal);
          if (chk.status === 404) {
            const near = await jfetch(
              BASE + "/data/search-zh.json",
              {},
              exec && exec.signal,
            );
            let hint = "";
            if (near.body && Array.isArray(near.body.items)) {
              const base = plugin.replace(/^@[^/]+\//, "").toLowerCase();
              const cands = near.body.items
                .filter((x) => String(x[0] || "").toLowerCase().includes(base.slice(0, 5)))
                .slice(0, 3)
                .map((x) => x[0]);
              if (cands.length) hint = `\nDichtbij namen: ${cands.join(", ")}`;
            }
            return {
              text:
                `"${plugin}" bestaat niet op npm (HTTP 404).\n` +
                `Er is niets ingediend — je gratis quotum is NIET gebruikt.\n` +
                `Controleer de pakketnaam. Volledige naam nodig, bijvoorbeeld dsh-pet of @scope/name.` +
                hint,
            };
          }
          if (chk.status !== 200) {
            return {
              text:
                `Kon "${plugin}" niet verifiëren op npm (HTTP ${chk.status}).\n` +
                `Niets ingediend. Probeer het later opnieuw of gebruik github:owner/repo.`,
            };
          }
        }

        const r = await jfetch(
          BASE + "/test/submit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plugin,
              dsh_version: ver,
              note: (args.note || "").slice(0, 300),
            }),
          },
          exec && exec.signal,
        );
        if (r.status === 200 && r.body && r.body.ok) {
          return {
            text:
              `Queued.\n` +
              `id: ${r.body.id}\n` +
              `plugin: ${args.plugin}\n` +
              `dsh_version: ${ver}\n` +
              `free tier left today: ${r.body.left_today}/${r.body.free_tier_per_day}\n\n` +
              `It usually runs within a few minutes. ` +
              `Call deepseekbase_test_result with plugin="${args.plugin}" to read the verdict.`,
          };
        }
        if (r.status === 429) {
          const b = r.body || {};
          return {
            text:
              `Daily free quota used up (${b.used_today || 3}/3 tests today).\n` +
              `Resets in about ${Math.round((b.resets_in_seconds || 0) / 3600)}h.\n` +
              `Higher quotas: ${BASE}/plugin-pricing/`,
          };
        }
        if (r.status === 400 && r.body) {
          if (r.body.error === "unsupported dsh_version") {
            return { text: `Unsupported version. Allowed: ${(r.body.allowed || []).join(", ")}` };
          }
          return {
            text:
              `Rejected: ${r.body.error || "invalid request"}. ` +
              `Use an npm package name (dsh-pet) or github:owner/repo.`,
          };
        }
        return { text: `Submit failed (HTTP ${r.status}). ${r.text.slice(0, 200)}` };
      },
    }),
  );

  // ── 6. Read a test result ────────────────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_test_result",
      description:
        "Read the sandbox test verdict for a plugin on deepseekbase: four stages " +
        "(install / list / mount / boot), node_modules size, install time and the first error " +
        "if it failed. Works for any plugin we have tested (3,400+ so far), not only the ones " +
        "you submitted.",
      parameters: {
        plugin: {
          type: "string",
          required: true,
          description: "npm package name or github:owner/repo to look up.",
        },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const wanted = (args.plugin || "").trim().toLowerCase();
        if (!wanted) return { text: "plugin is required." };
        const [all, slugs, queue, self] = await Promise.all([
          jfetch(BASE + "/data/plugin-tests-all.json", {}, exec && exec.signal),
          jfetch(BASE + "/data/plugin-slugs.json", {}, exec && exec.signal),
          jfetch(BASE + "/data/test-queue.json", {}, exec && exec.signal),
          jfetch(BASE + "/data/selfservice-results.json", {}, exec && exec.signal),
        ]);
        const slugMap = (slugs.body && typeof slugs.body === "object") ? slugs.body : {};

        // 自助提交的结果优先级最高：那是用户自己刚提交的
        const selfRows = (self.body && self.body.results) || [];
        const selfHit = selfRows.find(
          (r) => String(r.plugin || "").toLowerCase() === wanted && r.verdict,
        );
        if (selfHit) {
          const out = Object.assign({}, selfHit, {
            slug: slugMap[selfHit.plugin] || "",
          });
          return { text: renderTestResult(out, false) };
        }

        const rows = (all.body && all.body.results) || [];
        const hit = rows.find((r) => String(r.plugin || "").toLowerCase() === wanted);
        if (hit) {
          const out = Object.assign({}, hit, { slug: slugMap[hit.plugin] || "" });
          return { text: renderTestResult(out, false) };
        }

        // 队列里等着（自助队列优先）
        const selfQueue = selfRows.filter(
          (r) => String(r.plugin || "").toLowerCase() === wanted && !r.verdict,
        );
        const qi = (queue.body && queue.body.items) || [];
        const pend =
          selfQueue[0] ||
          qi.find(
            (x) => String(x.plugin || "").toLowerCase() === wanted && x.status === "queued",
          );
        if (pend) {
          return {
            text:
              `plugin: ${pend.plugin}\nstatus: queued (submitted ${pend.queued_at || "just now"})\n` +
              `Not tested yet — it is in the queue. Try again shortly.`,
          };
        }
        return {
          text:
            `No test result for "${args.plugin}" yet.\n` +
            `Submit one with deepseekbase_test_plugin, or browse ${rows.length} existing ` +
            `results at ${BASE}/ecosystem/plugin-tests/`,
        };
      },
    }),
  );

  // ── 7. Remaining free quota ──────────────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_quota",
      description:
        "Check the caller's remaining free sandbox-test quota for today " +
        "(free tier: 3 tests per IP per day).",
      parameters: {},
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(_args, exec) {
        const r = await jfetch(BASE + "/test/quota", {}, exec && exec.signal);
        if (r.status !== 200 || !r.body) {
          return { text: `Could not read quota (HTTP ${r.status}).` };
        }
        const b = r.body;
        return {
          text:
            `free tier: ${b.free_tier_per_day} tests per IP per day\n` +
            `used today: ${b.used_today}\n` +
            `left today: ${b.left_today}\n` +
            `resets in: ${Math.round((b.resets_in_seconds || 0) / 60)} min`,
        };
      },
    }),
  );

  // ── 8. DSHIO static conformance check ────────────────────────────────────
  ctx.tools.register(
    defineTool({
      name: "deepseekbase_check",
      description:
        "Run a static DSHIO/T 10 conformance check on a DSH plugin. Returns per-clause " +
        "results (clause id, pass/fail/skip/manual, evidence, fix). Static checks cover " +
        "the manifest, the patch file and the profile entry structure — no sandbox needed. " +
        "Clauses marked 'manual' require human judgement and are returned as a checklist, " +
        "not as a verdict. Use when asked whether a plugin conforms to the DSHIO standard.",
      parameters: {
        plugin: {
          type: "string",
          required: true,
          description: "npm package name or github:owner/repo to check.",
        },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const plugin = (args.plugin || "").trim();
        if (!plugin) return { text: "plugin is required." };
        const r = await jfetch(
          BASE + "/api/dshio/check?plugin=" + encodeURIComponent(plugin),
          {},
          exec && exec.signal,
        );
        if (r.status === 429) {
          return { text: "Rate limited (20 checks/min). Try again shortly." };
        }
        if (r.status !== 200 || !r.body) {
          return { text: `Check failed (HTTP ${r.status}). ${String(r.text).slice(0, 200)}` };
        }
        const d = r.body;
        if (d.error) {
          return { text: `Check failed: ${d.error}` };
        }
        const lines = [];
        lines.push(`plugin: ${d.plugin}`);
        if (d.resolved) lines.push(`version: ${d.resolved.version}`);
        lines.push(`baseline dsh: ${d.baseline_dsh}`);
        lines.push(`standard: DSHIO/T 10 (static layer)`);
        lines.push("");
        const icon = { pass: "[PASS]", fail: "[FAIL]", skip: "[SKIP]", manual: "[MANUAL]" };
        for (const x of d.results || []) {
          lines.push(`${icon[x.status] || x.status} ${x.clause}  ${x.title}`);
          if (x.status === "fail") {
            if (x.evidence) lines.push(`        evidence: ${x.evidence}`);
            if (x.fix) lines.push(`        fix: ${String(x.fix).split("\n")[0]}`);
          }
          if (x.status === "manual" && x.guidance) {
            lines.push(`        check yourself: ${x.guidance}`);
          }
        }
        const s = d.summary || {};
        lines.push("");
        lines.push(
          `summary: pass ${s.pass || 0} / fail ${s.fail || 0} / ` +
            `skip ${s.skip || 0} / manual ${s.manual || 0}`,
        );
        lines.push(`static conformance: ${d.conforming_static ? "YES" : "NO"}`);
        if (!d.conforming_static) {
          lines.push("");
          lines.push("Fix the critical failures first; a sandbox test would fail anyway.");
        }
        lines.push("");
        lines.push(`Full report: ${BASE}/plugins/${""}  · standard: ${BASE}/standards/`);
        return { text: lines.join("\n") };
      },
    }),
  );

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
