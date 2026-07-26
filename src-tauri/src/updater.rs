use serde::Serialize;
use std::sync::Mutex;
use tauri::{ipc::Channel, AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

pub struct PendingUpdate(Mutex<Option<Update>>);

impl Default for PendingUpdate {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMetadata {
    version: String,
    current_version: String,
    body: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        chunk_length: usize,
    },
    Finished,
    Installing,
}

#[tauri::command]
pub async fn fetch_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<Option<UpdateMetadata>, String> {
    let update = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    let metadata = update.as_ref().map(|update| UpdateMetadata {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        body: update.body.clone(),
    });

    *pending_update
        .0
        .lock()
        .map_err(|_| "更新状态暂时不可用".to_string())? = update;

    Ok(metadata)
}

#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let update = pending_update
        .0
        .lock()
        .map_err(|_| "更新状态暂时不可用".to_string())?
        .take()
        .ok_or_else(|| "没有待安装的更新，请重新检查".to_string())?;

    let progress_channel = on_event.clone();
    let installing_channel = on_event.clone();
    let mut started = false;

    update
        .download_and_install(
            move |chunk_length, content_length| {
                if !started {
                    let _ = progress_channel.send(DownloadEvent::Started { content_length });
                    started = true;
                }
                let _ = progress_channel.send(DownloadEvent::Progress { chunk_length });
            },
            move || {
                let _ = installing_channel.send(DownloadEvent::Installing);
            },
        )
        .await
        .map_err(|error| error.to_string())?;

    let _ = on_event.send(DownloadEvent::Finished);
    app.restart();
}
