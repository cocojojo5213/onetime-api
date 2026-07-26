# onetime-api

[English](README.md) | 中文

`onetime-api` 是面向临时或短期 API 凭据的跨平台桌面启动器。

应用以独立条目保存 Base URL、API Key、CLI Agent 和工作目录。启动配置时，所需环境变量仅注入新终端的子进程，不修改 Claude Code、Codex、Pi 等工具的全局配置。

## 功能

- 管理多组临时 API 配置
- 为不同 CLI Agent 定义启动命令和环境变量模板
- 在独立终端中启动 Agent
- 支持配置搜索、明亮/深色主题和启动状态反馈
- 自动检查 GitHub Releases，并提供手动下载入口
- 支持 Windows、macOS、Linux x64 和 Linux ARM64

## 使用

创建配置时填写名称、Base URL、API Key，并选择 Agent 模板。工作目录为可选项。

默认模板及其环境变量：

| Agent | 环境变量 |
|---|---|
| Claude Code | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` |
| Codex | `OPENAI_BASE_URL`, `OPENAI_API_KEY` |
| GrokBuild | `GROK_BASE_URL`, `GROK_API_KEY` |
| Pi | `PI_BASE_URL`, `PI_API_KEY` |

如需调整变量名或添加其他工具，可在「Agent 模板」中配置启动命令和环境变量。模板支持 `{base_url}` 和 `{api_key}` 占位符。

macOS 和 Linux 使用的临时启动脚本会在执行时自动删除。API Key 仅进入所启动终端的子进程环境。

## 安装

安装包发布在 [GitHub Releases](https://github.com/cocojojo5213/onetime-api/releases)。

| 平台 | CPU 架构 | 推荐资产 |
|---|---|---|
| Windows | x86_64 | `_x64-setup.exe` |
| macOS | Intel / Apple Silicon | `_universal.dmg` |
| Ubuntu / Debian | x86_64 | `_amd64.deb` |
| Ubuntu / Debian | ARM64 | `_arm64.deb` |
| 其他 Linux 发行版 | x86_64 | `_amd64.AppImage` |
| 其他 Linux 发行版 | ARM64 | `_aarch64.AppImage` |

Linux 架构可通过以下命令确认：

```bash
uname -m
```

输出 `x86_64` 时选择 x64/amd64 资产；输出 `aarch64` 或 `arm64` 时选择 ARM64 资产。

Debian 安装包可通过系统软件安装器打开，也可使用：

```bash
sudo apt install ./onetime-api_*_amd64.deb
sudo apt install ./onetime-api_*_arm64.deb
```

通过浏览器下载的 AppImage 通常不保留可执行权限。首次运行前需要执行：

```bash
chmod +x onetime-api_*.AppImage
./onetime-api_*.AppImage
```

## 更新

应用启动后会查询 GitHub 最新正式 Release，检查结果最多缓存 6 小时。侧栏底部显示当前版本和更新状态；版本入口支持立即重新检查并打开最新 Release 页面。

更新采用用户确认模式，应用不会在后台静默替换已安装程序。

## 从源码构建

构建环境需要 Rust、Node.js 18+，Linux 还需要 WebKitGTK 相关依赖，具体要求参见 [Tauri prerequisites](https://tauri.app/start/prerequisites/)。

```bash
npm install
npm run tauri dev
npm run tauri build
```

## 安全说明

配置文件位于 `~/.config/onetime-api/config.json`；Windows 路径为 `%APPDATA%\onetime-api\config.json`。

API Key 当前以明文形式保存在该文件中。请限制文件访问权限，并避免通过网盘、公开仓库或其他同步服务传播该文件。

License: MIT

感谢 [Linux.do](https://linux.do/) 社区的支持。
