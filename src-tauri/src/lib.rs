mod launcher;
mod updater;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
struct AgentTemplate {
    id: String,
    name: String,
    command: String,
    env: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct Profile {
    id: String,
    name: String,
    base_url: String,
    api_key: String,
    agent_id: String,
    #[serde(default)]
    workdir: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Config {
    agents: Vec<AgentTemplate>,
    profiles: Vec<Profile>,
}

fn default_agents() -> Vec<AgentTemplate> {
    let mk = |id: &str, name: &str, command: &str, env: &[(&str, &str)]| AgentTemplate {
        id: id.into(),
        name: name.into(),
        command: command.into(),
        env: env.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect(),
    };
    vec![
        mk("claude", "Claude Code", "claude", &[
            ("ANTHROPIC_BASE_URL", "{base_url}"),
            ("ANTHROPIC_AUTH_TOKEN", "{api_key}"),
        ]),
        mk("codex", "Codex", "codex", &[
            ("OPENAI_BASE_URL", "{base_url}"),
            ("OPENAI_API_KEY", "{api_key}"),
        ]),
        mk("grokbuild", "GrokBuild", "grokbuild", &[
            ("GROK_BASE_URL", "{base_url}"),
            ("GROK_API_KEY", "{api_key}"),
        ]),
        mk("pi", "Pi", "pi", &[
            ("PI_BASE_URL", "{base_url}"),
            ("PI_API_KEY", "{api_key}"),
        ]),
    ]
}

fn config_path() -> Result<PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or("无法定位配置目录")?
        .join("onetime-api");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("config.json"))
}

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[tauri::command]
fn load_config() -> Result<Config, String> {
    let path = config_path()?;
    if !path.exists() {
        let cfg = Config { agents: default_agents(), profiles: vec![] };
        save_config(cfg.clone())?;
        return Ok(cfg);
    }
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| format!("配置文件解析失败: {e}"))
}

#[tauri::command]
fn save_config(config: Config) -> Result<(), String> {
    let path = config_path()?;
    let data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn launch(profile_id: String) -> Result<(), String> {
    let cfg = load_config()?;
    let profile = cfg
        .profiles
        .iter()
        .find(|p| p.id == profile_id)
        .ok_or("找不到该配置")?;
    let agent = cfg
        .agents
        .iter()
        .find(|a| a.id == profile.agent_id)
        .ok_or("找不到对应的 agent 模板")?;

    let env: HashMap<String, String> = agent
        .env
        .iter()
        .map(|(k, v)| {
            let rendered = v
                .replace("{base_url}", &profile.base_url)
                .replace("{api_key}", &profile.api_key);
            (k.clone(), rendered)
        })
        .collect();

    let title = format!("{} · {}", agent.name, profile.name);
    let workdir = if profile.workdir.is_empty() { None } else { Some(profile.workdir.as_str()) };
    launcher::launch_in_terminal(&title, &agent.command, &env, workdir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(updater::PendingUpdate::default())
        .invoke_handler(tauri::generate_handler![
            app_version,
            load_config,
            save_config,
            launch,
            updater::fetch_update,
            updater::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
