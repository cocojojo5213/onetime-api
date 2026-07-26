# onetime-api

[English](README.md) | 中文

给临时 API 用的启动器。

经常从中转站拿到一些短期的 base URL + key，想在 codex、claude code 这类 CLI 上用，每次都得改各家的配置文件，用完还得改回去。这个工具把这些 API 存成条目，点启动直接弹一个注好环境变量的终端，全局配置不动。

## 用法

添加一条配置：名称、base URL、key，选一个 agent，保存。之后每次点「启动」就行。

启动时注入的变量：

| agent | 环境变量 |
|---|---|
| claude code | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` |
| codex | `OPENAI_BASE_URL`, `OPENAI_API_KEY` |
| grokbuild | `GROK_BASE_URL`, `GROK_API_KEY` |
| pi | `PI_BASE_URL`, `PI_API_KEY` |

变量名不对或者要加别的工具，在「Agent 模板」里改。模板就是一条命令加一组环境变量，`{base_url}` 和 `{api_key}` 是占位符。

key 只进那个终端的子进程环境。macOS/Linux 下中转用的临时脚本执行时会自删。

## 安装

[Releases](https://github.com/cocojojo5213/onetime-api/releases) 里有 Windows (.msi)、macOS (.dmg)、Linux (.deb/.AppImage) 的包，打 tag 后 CI 自动构建。

自己构建的话需要 Rust 和 Node 18+，Linux 还要 webkit2gtk 那套依赖（见 [Tauri 文档](https://tauri.app/start/prerequisites/)）：

```bash
npm install
npm run tauri dev
npm run tauri build
```

## 注意

配置存在 `~/.config/onetime-api/config.json`（Windows 是 `%APPDATA%\onetime-api`），key 是明文，别把这个文件同步出去。

License: MIT
