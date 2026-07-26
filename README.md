# onetime-api

English | [中文](README.zh-CN.md)

A launcher for throwaway API credentials.

API resellers often hand out short-lived base URL + key pairs. Using them with CLI agents like codex or claude code means editing each tool's config file, then reverting when the key dies. This tool stores them as entries instead — hit launch and you get a terminal with the right env vars injected, global configs untouched.

## Usage

Add an entry: name, base URL, key, pick an agent, save. Click "launch" whenever you want to use it.

Injected variables:

| agent | env vars |
|---|---|
| claude code | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` |
| codex | `OPENAI_BASE_URL`, `OPENAI_API_KEY` |
| grokbuild | `GROK_BASE_URL`, `GROK_API_KEY` |
| pi | `PI_BASE_URL`, `PI_API_KEY` |

Wrong variable name, or want another tool? Edit it under "Agent templates". A template is just a command plus a set of env vars, with `{base_url}` and `{api_key}` as placeholders.

The key only enters that terminal's process environment. On macOS/Linux the temporary wrapper script deletes itself on execution.

## Install

Grab a package from [Releases](https://github.com/cocojojo5213/onetime-api/releases) — Windows (.msi), macOS (.dmg), Linux (.deb/.AppImage). CI builds them on every tag.

To build yourself you need Rust and Node 18+, plus the webkit2gtk stack on Linux (see [Tauri docs](https://tauri.app/start/prerequisites/)):

```bash
npm install
npm run tauri dev
npm run tauri build
```

## Notes

Config lives at `~/.config/onetime-api/config.json` (`%APPDATA%\onetime-api` on Windows). Keys are stored in plain text — don't sync that file anywhere.

License: MIT
