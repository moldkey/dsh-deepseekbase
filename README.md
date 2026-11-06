# @liangjiehappy/dsh-deepseekbase

English | [中文](README.zh.md)

**DeepSeek prices, plugin discovery and model specs inside DeepSeek Harness.**

```bash
dsh plugin --profile web add github:moldkey/dsh-deepseekbase
```

---

## The part that matters: we test plugins for free

Most plugin directories tell you a plugin **exists**.

None tell you whether it **installs on your version of Harness**.

So we run real sandbox installs on every DSH plugin we index — **for free, forever**:

| Stage | What we do |
|---|---|
| 1 | Install it in a clean container (`dsh plugin add`) |
| 2 | Confirm it shows up in `dsh plugin list` |
| 3 | Confirm it mounts in the composed profile tree |
| 4 | Boot the profile and check it stays alive |

Stages 2–4 run with **`--network none`**, so even a malicious plugin has nowhere to send data.
Containers are destroyed after each run.

**Results so far: of the top 120 plugins, 13% cannot be installed at all on DSH 0.2.2-rc.1.**
Eight fail on `engines.dsh` version ranges, five are not on npm anymore.

Full results, updated as we test more:

**→ [deepseekbase.com/ecosystem/plugin-tests](https://deepseekbase.com/ecosystem/plugin-tests/)**

No sign-up. No API key. No rate limit on reading the results.

---

## What the plugin gives you

| Tool | What it answers |
|---|---|
| `deepseekbase_price` | What does DeepSeek cost, and which provider is cheapest? |
| `deepseekbase_plugin` | Which plugin does X, how popular, how risky? |
| `deepseekbase_specs` | How big is the model, what context length, does it fit? |
| `deepseekbase_trend` | How much is DeepSeek actually used? |

### Example

> **You:** compare DeepSeek V4.1 Flash prices across providers
>
> **Tool returns:**
> ```
> Official: off-peak in $0.15 / out $0.60 per 1M tokens
> Cheapest third party: Particle AI — in $0.025 / out $0.25
> ```
> That is a 6x spread on the same model.

---

## Install

```bash
dsh plugin --profile web add github:moldkey/dsh-deepseekbase
```

Restart Harness. Four tools become available.

From npm (once published):

```bash
dsh plugin --profile web add @liangjiehappy/dsh-deepseekbase
```

---

## Permissions

This plugin:

- makes **outbound HTTPS requests** to `deepseekbase.com` only
- does **not** read or write your files
- does **not** read credentials or environment variables
- does **not** execute shell commands

The whole implementation is `lib/index.js` — one file, zero runtime dependencies.
You can audit it in five minutes.

---

## Data sources

| Endpoint | Used for |
|---|---|
| `POST https://deepseekbase.com/mcp` | prices, plugins, specs |
| `GET https://deepseekbase.com/data/openrouter-tokens.json` | token trend |

Everything is also browsable at <https://deepseekbase.com>.

---

## What is deepseekbase

A third-party index of the DeepSeek ecosystem. Not affiliated with DeepSeek.

| | |
|---|---|
| **283 pages** | pricing, providers, 7,164 derived models, 8,559 plugins, industry kits |
| **21 open datasets** | every figure carries its source and verification date |
| **Free plugin testing** | real sandbox installs, results published |
| **MCP server** | `https://deepseekbase.com/mcp` for any MCP client |

We label measurement bases explicitly. Where sources disagree, we say so instead of picking
the flattering number.

---

## Contributing

Found a bug? [Open an issue](https://github.com/moldkey/dsh-deepseekbase/issues).

Maintain a plugin that failed our test? The error message tells you exactly why —
take it and fix it. We are recording a fact, not judging your code.

Want your plugin tested? It is free:
<https://deepseekbase.com/ecosystem/plugin-tests/>

---

## Licence

MIT. Compiled data is attributed per entry on the website.
