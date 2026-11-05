# dsh-deepseekbase

DeepSeek prices, plugin discovery **with sandbox test results**, model specs and
token-volume trends — inside DeepSeek Harness.

Data comes from [deepseekbase.com](https://deepseekbase.com), a third-party index.
Read-only. No API key. Nothing leaves your machine except the queries you make.

## Install

```bash
dsh plugin --profile web add github:moldkey/dsh-deepseekbase
```

Or from npm (once published):

```bash
dsh plugin --profile web add dsh-deepseekbase
```

Then restart Harness. Four tools become available:

| Tool | What it answers |
|---|---|
| `deepseekbase_price` | What does DeepSeek cost, and which provider is cheapest? |
| `deepseekbase_plugin` | Which plugin does X, how popular is it, and how risky? |
| `deepseekbase_specs` | How big is the model, what context length, does it fit? |
| `deepseekbase_trend` | How much is DeepSeek actually used? |

## Why this exists

Most plugin directories tell you a plugin **exists**. None tell you whether it
**installs on your version of Harness**.

[deepseekbase.com/ecosystem/plugin-tests/](https://deepseekbase.com/ecosystem/plugin-tests/)
runs real sandbox installs against the current DSH release — install, list, mount,
boot — and publishes the results. As of the latest run, **13% of the top 120 plugins
cannot be installed at all** on DSH 0.2.2-rc.1.

## Permissions

This plugin:

- makes **outbound HTTPS requests** to `deepseekbase.com` only
- does **not** read or write your files
- does **not** read credentials or environment variables
- does **not** execute shell commands

If you want to audit it: the whole implementation is `lib/index.js`, one file,
no dependencies.

## Data sources

| Endpoint | Used for |
|---|---|
| `POST https://deepseekbase.com/mcp` | prices, plugins, specs |
| `GET https://deepseekbase.com/data/openrouter-tokens.json` | token trend |

Everything is also browsable at <https://deepseekbase.com>.

## Licence

MIT. The data itself is compiled from public sources and carries per-entry
attribution on the website.
