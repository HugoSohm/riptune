use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Child;
use std::sync::Mutex;

pub struct ProcessState(pub Mutex<HashMap<String, Child>>);

#[derive(Serialize, Deserialize, Debug)]
pub struct UrlInfo {
    pub is_playlist: bool,
    pub count: Option<u32>,
    pub title: String,
}

#[derive(Serialize, Clone)]
pub struct ProgressEvent {
    pub current: u32,
    pub total: u32,
    pub title: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DownloadResult {
    pub filepath: String,
    pub title: String,
    pub artist: String,
    pub url: String,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DownloadResponse {
    pub results: Vec<DownloadResult>,
    pub playlist_dir: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DownloadArgs {
    pub url: String,
    pub format: String,
    pub custom_path: Option<String>,
    pub cookies: Option<String>,
    pub download_playlist: bool,
    pub playlist_title: Option<String>,
    pub task_id: String,
}
