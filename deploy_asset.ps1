$source = "C:\Users\ShivaDosala\.gemini\antigravity\brain\23f4802f-2c8a-405c-b6dd-80878e2c731e\world_map_technical_bg_1767603844699.png"
$dest = "c:\Users\ShivaDosala\Desktop\RemoteX\client\src\assets\world-map.png"
if (Test-Path $source) {
    Copy-Item -Path $source -Destination $dest -Force -ErrorAction Stop
    Write-Output "Successfully copied $source to $dest"
} else {
    Write-Error "Source file not found: $source"
}
