@echo off
echo ========================================
echo RemoteX - Force Clean Restart
echo ========================================
echo.

echo Step 1: Killing any processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Step 2: Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared
) else (
    echo No Vite cache found
)

echo.
echo Step 3: Starting signaling server...
start "Signaling Server" cmd /k "node signaling-server.js"

timeout /t 2 /nobreak >nul

echo Step 4: Starting Vite dev server...
start "Vite Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo IMPORTANT INSTRUCTIONS:
echo ========================================
echo 1. Wait for both servers to start (check the new windows)
echo 2. Open browser in INCOGNITO mode (Ctrl+Shift+N)
echo 3. Go to: http://localhost:5173
echo 4. Open console (F12)
echo 5. Look for emoji messages: 📹 ✅ 📨 🔄
echo ========================================
echo.
pause
