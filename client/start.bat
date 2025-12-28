@echo off
echo Starting RemoteX Application...
echo.

REM Kill any existing processes on port 3001
echo Checking for existing signaling server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Starting signaling server...
start "RemoteX Signaling Server" cmd /k "node signaling-server.js"

timeout /t 2 /nobreak >nul

echo Starting Vite dev server...
start "RemoteX Vite Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo RemoteX is starting!
echo ========================================
echo Signaling Server: http://127.0.0.1:3001
echo Vite Dev Server: http://localhost:5173
echo ========================================
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:5173

echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
