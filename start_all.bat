@echo off
echo ==========================================
echo       Starting RemoteX System
echo ==========================================

echo [1/2] Launching Signaling Server...
start "RemoteX Server" cmd /k "cd client && npm run server"

echo Waiting for server to initialize...
timeout /t 3 >nul

echo [2/2] Launching Client Application...
cd client
npm start
