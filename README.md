# onetime-api

English | [中文](README.zh-CN.md)

`onetime-api` is a cross-platform desktop launcher for temporary or short-lived API credentials.

Each profile stores a Base URL, API key, CLI agent, and optional working directory. Launching a profile injects the required environment variables into a new terminal process without modifying the global configuration of tools such as Claude Code, Codex, or Pi.

## Features

- Manage multiple temporary API profiles
- Define commands and environment-variable templates for CLI agents
- Launch agents in isolated terminal sessions
- Search profiles and switch between light and dark themes
- Check GitHub Releases automatically and expose a manual download entry
- Support Windows, macOS, Linux x64, and Linux ARM64

## Usage

A profile contains a name, Base URL, API key, and agent template. The working directory is optional.

Default templates and injected variables:

| Agent | Environment variables |
|---|---|
| Claude Code | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` |
| Codex | `OPENAI_BASE_URL`, `OPENAI_API_KEY` |
| GrokBuild | `GROK_BASE_URL`, `GROK_API_KEY` |
| Pi | `PI_BASE_URL`, `PI_API_KEY` |

Additional tools and variable mappings can be configured under **Agent templates**. Template values support the `{base_url}` and `{api_key}` placeholders.

Temporary launcher scripts on macOS and Linux delete themselves when executed. API keys are only injected into the launched terminal's child-process environment.

## Installation

Installers are published on [GitHub Releases](https://github.com/cocojojo5213/onetime-api/releases).

| Platform | CPU architecture | Recommended asset |
|---|---|---|
| Windows | x86_64 | `_x64-setup.exe` |
| macOS | Intel / Apple Silicon | `_universal.dmg` |
| Ubuntu / Debian | x86_64 | `_amd64.deb` |
| Ubuntu / Debian | ARM64 | `_arm64.deb` |
| Other Linux distributions | x86_64 | `_amd64.AppImage` |
| Other Linux distributions | ARM64 | `_aarch64.AppImage` |

Linux architecture can be identified with:

```bash
uname -m
```

`x86_64` maps to x64/amd64 assets. `aarch64` and `arm64` map to ARM64 assets.

Debian packages can be opened with a graphical software installer or installed with:

```bash
sudo apt install ./onetime-api_*_amd64.deb
sudo apt install ./onetime-api_*_arm64.deb
```

AppImages downloaded through a browser usually do not retain executable permissions. Before the first launch:

```bash
chmod +x onetime-api_*.AppImage
./onetime-api_*.AppImage
```

## Updates

The application checks a signed update manifest after launch. When a newer version is available, the version dialog can download, verify, install, and restart the application without requiring a browser download. Every update package is verified against the public signing key embedded in the application before installation.

Installation remains user-confirmed: downloading starts only after **Download and install** is selected. Linux `.deb` updates request administrator authorization through the operating system; AppImage updates require the current file to be writable.

Versions up to `v0.2.1` only contain the browser-based update check and must install `v0.2.2` manually once. Releases after that bridge version support the in-app update flow.

## Building from source

The build requires Rust and Node.js 18+. Linux builds also require the WebKitGTK development stack described in the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri dev
npm run tauri build
```

Maintainer signing and release procedures are documented in [`docs/RELEASING.md`](docs/RELEASING.md).

## Security

The configuration file is stored at `~/.config/onetime-api/config.json`; on Windows it is stored at `%APPDATA%\onetime-api\config.json`.

API keys are currently stored as plain text in this file. File access should be restricted, and the configuration file should not be placed in public repositories, cloud drives, or other synchronization services.

License: MIT

Thanks to the [Linux.do](https://linux.do/) community for its support.
