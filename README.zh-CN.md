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

[Releases](https://github.com/cocojojo5213/onetime-api/releases) 会提供 Windows、macOS 和 Linux 安装包。Linux 同时构建两种 CPU 架构：

| 你的系统 | 选择的资产后缀 |
|---|---|
| Intel / AMD 64 位（`x86_64`） | `amd64` |
| ARM 64 位（`aarch64` / `arm64`） | `arm64` |

Ubuntu / Debian 建议下载对应架构的 `.deb`，通常可以双击交给系统的软件安装器；也可以在下载目录运行：

```bash
sudo apt install ./onetime-api_*_amd64.deb   # Intel / AMD
sudo apt install ./onetime-api_*_arm64.deb   # ARM64
```

`.AppImage` 是免安装便携版，但浏览器下载不会保留 Linux 的可执行权限。确认架构匹配后，首次运行前执行一次：

```bash
chmod +x onetime-api_*.AppImage
./onetime-api_*.AppImage
```

自己构建的话需要 Rust 和 Node 18+，Linux 还要 webkit2gtk 那套依赖（见 [Tauri 文档](https://tauri.app/start/prerequisites/)）：

```bash
npm install
npm run tauri dev
npm run tauri build
```

## 更新

应用启动后会自动检查 GitHub Releases，检查结果最多缓存 6 小时。侧栏底部会显示当前版本和更新状态；点击版本入口可以立即重新检查，并打开最新版本下载页。

更新采用用户确认模式，不会在后台静默替换程序。Linux 用户仍需选择与 CPU 架构匹配的 `.deb` 或 `.AppImage`。

## 注意

配置存在 `~/.config/onetime-api/config.json`（Windows 是 `%APPDATA%\onetime-api`），key 是明文，别把这个文件同步出去。

License: MIT

感谢 [Linux.do](https://linux.do/) 社区的支持。
