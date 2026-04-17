use serde::{Deserialize, Serialize};
use std::process::Child;
use std::sync::Mutex;

pub struct ProcessState(pub Mutex<Option<Child>>);

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
}
