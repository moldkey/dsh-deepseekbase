# @liangjiehappy/dsh-dshio

English | [中文](README.zh.md)

**The DSHIO standard system as DeepSeek Harness skills — five of them, versioned, fetched from dshio.org.**

```bash
dsh plugin --profile web add @liangjiehappy/dsh-dshio
```

Or in the Web UI: **Plugins → Add plugin → `@liangjiehappy/dsh-dshio`**

---

## What you get

| Skill | Version | Standard | What it answers |
|---|---|---|---|
| `dshio-standards` | 1.0.0 | DSHIO/T 00, 10, 20, 21, 32 | What does the standard actually say? |
| `dshio-check` | 1.0.0 | DSHIO/T 10 | How do I check a plugin for conformance? |
| `dsh-plugin-dev` | 1.0.0 | DSHIO/T 10 | How do I write a plugin that installs? |
| `dshio-testing` | 1.0.0 | DSHIO/T 20, 21 | What does `installs_but_not_registered` mean? |
| `dshio-glossary` | 1.0.0 | DSHIO/T 00 | What exactly is a plugin, a bundle, a tool? |

Total: about 14,000 characters of standards-derived knowledge.

---

## Why a separate package

The standard is published by DSHIO, the data tools by deepseekbase. Keeping them in one package
would make the standard look like part of a product. Splitting them keeps the identity clean:

| You want | Install |
|---|---|
| Only the standards | `@liangjiehappy/dsh-dshio` (this package) |
| The data tools (brings the standards too) | `@liangjiehappy/dsh-deepseekbase` |
| The plugin market inside DSH | `@liangjiehappy/dsh-deepseekbase-market` |

---

## Content updates without reinstalling

The skills do not live in this package's JS bundle. On startup it fetches:

```
https://dshio.org/api/dshio/skills.json
```

If the content differs from the bundled copy, the bundled one is replaced at runtime.
**We update the standard, you get it on next launch — no npm upgrade.**

If the fetch fails (offline, blocked), the bundled copy stays in place, so the skills always work.

Every skill carries a `version` and the `standard` it derives from, so you can tell which revision
you are reading.

---

## What it does not do

- No tools registered
- No file reads or writes
- No shell access
- No credential access
- No telemetry

It registers skills and nothing else. Outbound HTTPS to `dshio.org` only.

---

## Attribution

The standards are DSHIO's own, independently derived from the official DSH development kit's
observed behaviour — **not** an official DeepSeek specification. Official links:

- [DeepSeek](https://www.deepseek.com) · [Harness](https://deepseek.com/harness)
- [Official repository](https://github.com/deepseek-ai/deepseek-harness) · [API docs](https://api-docs.deepseek.com)

Web version of every standard: **https://dshio.org**

MIT licensed. Source: [github.com/moldkey/dsh-deepseekbase](https://github.com/moldkey/dsh-deepseekbase)
