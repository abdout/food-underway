# Fix Next.js trace file lock on Windows
Write-Host "Stopping Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Unlocking .next folder..." -ForegroundColor Yellow
if (Test-Path .next) {
    # Take ownership and grant full permissions
    takeown /F .next /R /D Y 2>$null
    icacls .next /grant "$env:USERNAME:(OI)(CI)F" /T 2>$null

    Write-Host "Removing .next folder..." -ForegroundColor Yellow
    Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Done! Now run: pnpm dev" -ForegroundColor Green
