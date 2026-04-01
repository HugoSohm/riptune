# PowerShell script to download RipTune binaries (sideloads)
# Usage: ./setup_bin.ps1

$BinDir = Join-Path $PSScriptRoot "src-tauri\bin"
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir | Out-Null
}

Write-Host "--- RipTune: Setting up bin binaries ---" -ForegroundColor Cyan

# 1. yt-dlp.exe
$YtDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$YtDlpPath = Join-Path $BinDir "yt-dlp.exe"
if (-not (Test-Path $YtDlpPath)) {
    Write-Host "Downloading yt-dlp.exe..."
    Invoke-WebRequest -Uri $YtDlpUrl -OutFile $YtDlpPath
}

# 2. ffmpeg.exe (Simplified: downloading essentials build)
$FFmpegZipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$FFmpegZipPath = Join-Path $env:TEMP "ffmpeg_essential.zip"
if (-not (Test-Path (Join-Path $BinDir "ffmpeg.exe"))) {
    Write-Host "Downloading FFmpeg essentials zip (this may take a moment)..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $FFmpegZipUrl -OutFile $FFmpegZipPath
    
    Write-Host "Extracting FFmpeg binaries..."
    $ExtractPath = Join-Path $env:TEMP "ffmpeg_extract"
    Expand-Archive -Path $FFmpegZipPath -DestinationPath $ExtractPath -Force
    
    # Locate the bin folder in the extracted zip (name of folder contains version)
    $ActualBin = Get-ChildItem -Path $ExtractPath -Filter "bin" -Recurse | Select-Object -First 1
    if ($ActualBin) {
        Copy-Item -Path "$($ActualBin.FullName)\*" -Destination $BinDir -Force
    }
    Remove-Item $FFmpegZipPath -Force
    Remove-Item $ExtractPath -Recurse -Force
}

# 3. streaming_extractor_music.exe (Essentia)
$EssentiaUrl = "https://data.metabrainz.org/pub/musicbrainz/acousticbrainz/extractors/essentia-extractor-v2.1_beta2-1-ge3940c0-win-i686.zip"
$EssentiaZipPath = Join-Path $env:TEMP "essentia.zip"
if (-not (Test-Path (Join-Path $BinDir "streaming_extractor_music.exe"))) {
    Write-Host "Downloading Essentia extractor..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $EssentiaUrl -OutFile $EssentiaZipPath
        Write-Host "Extracting Essentia binary..."
        Expand-Archive -Path $EssentiaZipPath -DestinationPath $BinDir -Force
        Remove-Item $EssentiaZipPath -Force
    }
    catch {
        Write-Host "Warning: Could not download Essentia automatically. Please place 'streaming_extractor_music.exe' manually in $BinDir" -ForegroundColor Red
    }
}

Write-Host "--- Setup Complete! ---" -ForegroundColor Green
Write-Host "Binaries are located in: $BinDir"
