use std::collections::HashMap;
use std::process::Command;

/// Launch `command` in a new terminal window with `env` injected.
/// The API key only lives in the child process environment; no agent
/// config files are touched.
pub fn launch_in_terminal(
    title: &str,
    command: &str,
    env: &HashMap<String, String>,
    workdir: Option<&str>,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        launch_windows(title, command, env, workdir)
    }
    #[cfg(target_os = "macos")]
    {
        launch_macos(title, command, env, workdir)
    }
    #[cfg(target_os = "linux")]
    {
        launch_linux(title, command, env, workdir)
    }
}

#[cfg(target_os = "windows")]
fn launch_windows(
    title: &str,
    command: &str,
    env: &HashMap<String, String>,
    workdir: Option<&str>,
) -> Result<(), String> {
    // `start` opens a new console window; /k keeps it open after the command exits.
    let mut cmd = Command::new("cmd");
    cmd.args(["/c", "start", title, "cmd", "/k", command]);
    cmd.envs(env);
    if let Some(dir) = workdir.filter(|d| !d.is_empty()) {
        cmd.current_dir(dir);
    }
    cmd.spawn().map_err(|e| format!("启动失败: {e}"))?;
    Ok(())
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
fn write_wrapper_script(
    title: &str,
    command: &str,
    env: &HashMap<String, String>,
    workdir: Option<&str>,
) -> Result<std::path::PathBuf, String> {
    use std::io::Write;
    use std::os::unix::fs::PermissionsExt;

    let mut script = String::from("#!/bin/bash\n");
    // The script self-deletes so the key doesn't linger on disk.
    script.push_str("rm -f \"$0\"\n");
    script.push_str(&format!("echo \"[onetime-api] {}\"\n", shell_escape(title)));
    if let Some(dir) = workdir.filter(|d| !d.is_empty()) {
        script.push_str(&format!("cd {} || exit 1\n", shell_quote(dir)));
    }
    for (k, v) in env {
        script.push_str(&format!("export {}={}\n", k, shell_quote(v)));
    }
    script.push_str(&format!("{command}\n"));
    // Keep the window open after the agent exits.
    script.push_str("exec bash\n");

    let dir = std::env::temp_dir();
    let path = dir.join(format!(
        "onetime-api-{}.sh",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos()
    ));
    let mut f = std::fs::File::create(&path).map_err(|e| e.to_string())?;
    f.write_all(script.as_bytes()).map_err(|e| e.to_string())?;
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o700))
        .map_err(|e| e.to_string())?;
    Ok(path)
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
fn shell_quote(s: &str) -> String {
    format!("'{}'", s.replace('\'', r"'\''"))
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
fn shell_escape(s: &str) -> String {
    s.replace('"', "\\\"")
}

#[cfg(target_os = "macos")]
fn launch_macos(
    title: &str,
    command: &str,
    env: &HashMap<String, String>,
    workdir: Option<&str>,
) -> Result<(), String> {
    let script = write_wrapper_script(title, command, env, workdir)?;
    Command::new("open")
        .args(["-a", "Terminal"])
        .arg(&script)
        .spawn()
        .map_err(|e| format!("启动 Terminal 失败: {e}"))?;
    Ok(())
}

#[cfg(target_os = "linux")]
fn launch_linux(
    title: &str,
    command: &str,
    env: &HashMap<String, String>,
    workdir: Option<&str>,
) -> Result<(), String> {
    let script = write_wrapper_script(title, command, env, workdir)?;
    let script_str = script.to_string_lossy().to_string();

    // (terminal binary, args before the command)
    let candidates: &[(&str, &[&str])] = &[
        ("x-terminal-emulator", &["-e"]),
        ("gnome-terminal", &["--"]),
        ("konsole", &["-e"]),
        ("xfce4-terminal", &["-x"]),
        ("alacritty", &["-e"]),
        ("kitty", &[]),
        ("xterm", &["-e"]),
    ];
    for (term, args) in candidates {
        if which(term) {
            Command::new(term)
                .args(*args)
                .arg(&script_str)
                .spawn()
                .map_err(|e| format!("启动 {term} 失败: {e}"))?;
            return Ok(());
        }
    }
    Err("未找到可用的终端模拟器 (x-terminal-emulator/gnome-terminal/konsole/xterm...)".into())
}

#[cfg(target_os = "linux")]
fn which(bin: &str) -> bool {
    std::env::var_os("PATH")
        .map(|paths| {
            std::env::split_paths(&paths).any(|p| p.join(bin).is_file())
        })
        .unwrap_or(false)
}
