# PowerShell script to download RipTune binaries (sideloads)
# Usage: ./setup_bin.ps1

$BinDir = Join-Path $PSScriptRoot "src-tauri\bin"
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir | Out-Null
}

Write-Host "--- RipTune: Setting up bin binaries ---" -ForegroundColor Cyan

function Invoke-Download {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [Parameter(Mandatory = $true)]
        [string]$OutFile
    )
    
    Write-Host "Downloading from $Url..."
    try {
        $OldPreference = $ProgressPreference
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $Url -OutFile $OutFile -ErrorAction Stop
        $ProgressPreference = $OldPreference
    }
    catch {
        Write-Host "Error: Failed to download from $Url. $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }

    if (-not (Test-Path $OutFile)) {
        Write-Host "Error: $OutFile was not created." -ForegroundColor Red
        exit 1
    }
}

# 1. yt-dlp.exe
$YtDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$YtDlpPath = Join-Path $BinDir "yt-dlp.exe"
if (-not (Test-Path $YtDlpPath)) {
    Invoke-Download -Url $YtDlpUrl -OutFile $YtDlpPath
}

# 2. ffmpeg.exe (Simplified: downloading essentials build)
$FFmpegZipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$FFmpegZipPath = Join-Path $env:TEMP "ffmpeg_essential.zip"
if (-not (Test-Path (Join-Path $BinDir "ffmpeg.exe"))) {
    Invoke-Download -Url $FFmpegZipUrl -OutFile $FFmpegZipPath
    
    Write-Host "Extracting FFmpeg binaries..."
    $ExtractPath = Join-Path $env:TEMP "ffmpeg_extract"
    Expand-Archive -Path $FFmpegZipPath -DestinationPath $ExtractPath -Force
    
    # Locate the bin folder in the extracted zip
    $ActualBin = Get-ChildItem -Path $ExtractPath -Filter "bin" -Recurse | Select-Object -First 1
    if ($ActualBin) {
        Copy-Item -Path "$($ActualBin.FullName)\*" -Destination $BinDir -Force
    }
    Remove-Item $FFmpegZipPath -Force
    Remove-Item $ExtractPath -Recurse -Force
}

Write-Host "--- Setup Complete! ---" -ForegroundColor Green
Write-Host "Binaries are located in: $BinDir"
