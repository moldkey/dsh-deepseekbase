# dsh-deepseekbase

English | [中文](README.zh.md)

**DeepSeek prices, plugin search and sandbox test results — inside DeepSeek Harness.**

```bash
dsh plugin --profile web add @liangjiehappy/dsh-deepseekbase
```

---

## What you can do from inside DSH

| Ask | Tool it calls |
|---|---|
| "What does DeepSeek cost?" | `deepseekbase_price` |
| "Find me a memory plugin" | `deepseekbase_plugin` |
| "How big is V4-Flash?" | `deepseekbase_specs` |
| "How much DeepSeek is actually used?" | `deepseekbase_trend` |
| **"Test whether my plugin dsh-foo installs"** | **`deepseekbase_test_plugin`** |
| **"Did it pass?"** | **`deepseekbase_test_result`** |
| **"How many free tests do I have left?"** | **`deepseekbase_quota`** |

Seven tools, one file, zero runtime dependencies. Outbound HTTPS to `deepseekbase.com` only.

---

## Test your own plugin without leaving DSH

Most plugin directories tell you a plugin **exists**. None tell you whether it **installs on your
version of Harness**.

So we run real sandbox installs — and the plugin lets you submit yours directly:

```
You: test whether dsh-foo installs on 0.2.2-rc.1

DSH: [deepseekbase_test_plugin]
     Queued.
     id: 1793979912-48671
     free tier left today: 2/3
     It usually runs within a few minutes.

You: did it pass?

DSH: [deepseekbase_test_result]
     plugin: dsh-foo
     verdict: tested: pass
     install_ok: True
     node_modules: 12.4 MB
```

**Free tier: 3 tests per IP per day.** No sign-up, no API key.
Higher quotas are planned but not open yet — see
[pricing](https://deepseekbase.com/plugin-pricing/#test-service).

### What the four stages check

| Stage | Network | Check |
|---|---|---|
| 1 install | on | `dsh plugin add` in a clean profile |
| 2 list | **off** | `dsh plugin list` shows it |
| 3 mount | **off** | `--dump-config` contains it |
| 4 boot | **off** | profile boots and stays alive for 12 s |

Stages 2–4 run with `--network none`, so even a malicious plugin has nowhere to send data.
Containers are destroyed after each run.

---

## Results so far

**3,500+ plugins actually installed and mounted** in our sandbox, across the top 2,000 by downloads.

| Verdict | Count |
|---|---|
| pass | 2,822 |
| install fails | 654 |
| mounts but not registered | 35 |
| boot fails | 10 |

Browse all of them, searchable, with per-plugin pages:

**→ [deepseekbase.com/plugins](https://deepseekbase.com/plugins/)**
**→ [deepseekbase.com/ecosystem/plugin-tests](https://deepseekbase.com/ecosystem/plugin-tests/)**

No sign-up. No API key. No rate limit on **reading** the results.

---

## What it does not do

- No file reads or writes
- No shell access
- No credential access
- No telemetry

The whole implementation is one file — five minutes to audit.

---

## Data attribution

Prices come from DeepSeek's official API docs. Plugin data comes from the public npm registry and
GitHub. Test verdicts are our own sandbox runs, not official DeepSeek output.
This is a third-party index — cite it as such.

MIT licensed. Source: [github.com/moldkey/dsh-deepseekbase](https://github.com/moldkey/dsh-deepseekbase)
