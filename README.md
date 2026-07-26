<div align="center">

# ⚡ onetime-api

**一次性 API 启动器 — 填一次，点一下，直接开跑**

把中转站给的临时 base URL + API key 变成一键启动的 agent 终端，
再也不用手改 `config.toml` / `settings.json`。

[![Build](https://github.com/cocojojo5213/onetime-api/actions/workflows/build.yml/badge.svg)](https://github.com/cocojojo5213/onetime-api/actions/workflows/build.yml)
[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-8b8e99)](#-下载与打包)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 😫 痛点

第三方上游 API 经常是**一次性的、短期的**：今天拿到一个中转 key，想在 Codex / Claude Code / GrokBuild / Pi 上用一下，就得去改各家的配置文件；明天 key 换了，又改一遍。改来改去，全局配置还容易被污染。

## ✨ 解法

onetime-api 是一个 **~5MB 的轻量桌面工具**（Tauri 2）：

- 📝 **填一次** — 名称 + base URL + API key，保存成配置卡片
- 🚀 **点一下** — 弹出一个新终端，环境变量已注入，agent 直接可用
- 🧼 **零污染** — key 只存在于那个终端的子进程环境里，**不碰任何 agent 的全局配置文件**
- 🔌 **可扩展** — agent 定义为「命令 + 环境变量模板」，界面里就能加新工具

```text
┌─────────────────────────────┐
│  onetime-api                │
│                             │      ┌──────────────────────────────┐
│  ▢ 某中转-0726   [▶ 启动] ──┼────▶ │ 新终端窗口                    │
│     Claude Code             │      │ ANTHROPIC_BASE_URL=https://… │
│  ▢ 测试key-A     [▶ 启动]   │      │ ANTHROPIC_AUTH_TOKEN=sk-…    │
│     Codex                   │      │ $ claude                     │
└─────────────────────────────┘      └──────────────────────────────┘
```

## 🎯 内置模板

| Agent | 命令 | 注入的环境变量 |
|---|---|---|
| **Claude Code** | `claude` | `ANTHROPIC_BASE_URL` · `ANTHROPIC_AUTH_TOKEN` |
| **Codex** | `codex` | `OPENAI_BASE_URL` · `OPENAI_API_KEY` |
| **GrokBuild** | `grokbuild` | `GROK_BASE_URL` · `GROK_API_KEY` |
| **Pi** | `pi` | `PI_BASE_URL` · `PI_API_KEY` |

> 变量名不对？点「Agent 模板」直接改；模板里用 `{base_url}` / `{api_key}` 占位符，加任意新工具都不用改代码。

## 📦 下载与打包

从 [Releases](https://github.com/cocojojo5213/onetime-api/releases) 下载对应平台安装包（打 `v*` tag 后由 GitHub Actions 自动构建）：

| 平台 | 产物 |
|---|---|
| Windows | `.msi` / `.exe` |
| macOS | `.dmg`（universal，Intel + Apple Silicon） |
| Linux | `.deb` / `.AppImage` |

## 🛠 本地开发

需要 [Rust](https://rustup.rs) 与 Node.js ≥ 18（Linux 另需 [Tauri 系统依赖](https://tauri.app/start/prerequisites/)）：

```bash
git clone https://github.com/cocojojo5213/onetime-api.git
cd onetime-api
npm install
npm run tauri dev     # 开发运行
npm run tauri build   # 本机打包
```

## 🔒 数据与安全

- 配置保存在本地：`~/.config/onetime-api/config.json`（Windows：`%APPDATA%\onetime-api`，macOS：`~/Library/Application Support/onetime-api`）
- **API key 明文存本地**（与各 CLI 自身配置行为一致），请勿同步该文件到公开位置
- macOS / Linux 启动时生成的临时包装脚本会**立即自删**，key 不落盘

## 📄 License

[MIT](LICENSE)
