// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Desktop-launched apps do not inherit PATH entries from shell profiles.
    // Restore them before resolving terminal and agent commands.
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    let _ = fix_path_env::fix();

    onetime_api_lib::run()
}
