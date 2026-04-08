use id3::frame::{Content, Frame};
use id3::{Tag, TagLike};

#[tauri::command]
pub async fn update_metadata(
    filepath: String,
    title: String,
    artist: String,
    bpm: f64,
) -> Result<(), String> {
    if !std::path::Path::new(&filepath).exists() {
        return Err("File not found on disk".to_string());
    }

    let mut tag = Tag::new();

    if let Ok(existing_tag) = Tag::read_from_path(&filepath) {
        tag = existing_tag;
    }

    tag.set_title(title);
    tag.set_artist(artist);

    tag.add_frame(Frame::with_content(
        "TBPM",
        Content::Text((bpm.round() as u32).to_string()),
    ));

    tag.write_to_path(&filepath, id3::Version::Id3v24)
        .map_err(|e| e.to_string())?;
    Ok(())
}
