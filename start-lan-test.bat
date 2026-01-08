@echo off
REM RemoteX LAN Testing - Quick Start Script
REM This script helps you set up RemoteX for testing on two laptops

echo ========================================
echo RemoteX LAN Network Testing Setup
echo ========================================
echo.

REM Get local IP address
echo Finding your local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%
echo.
echo ========================================
echo YOUR SERVER IP ADDRESS: %IP%
echo ========================================
echo.
echo IMPORTANT: Share this IP with the other laptop!
echo.
echo The other laptop should access:
echo   http://%IP%:5173/?mode=client
echo.
echo ========================================
echo.

echo Choose what to run on THIS laptop:
echo.
echo [1] Run BOTH Server + Client (Technician Laptop)
echo [2] Run ONLY Signaling Server
echo [3] Run ONLY Client (Customer Laptop)
echo [4] Exit
echo.

choice /C 1234 /N /M "Enter your choice (1-4): "

if errorlevel 4 goto :end
if errorlevel 3 goto :client_only
if errorlevel 2 goto :server_only
if errorlevel 1 goto :both

:both
echo.
echo Starting Server + Client on %IP%...
echo.
echo Opening 2 terminals:
echo   Terminal 1: Signaling Server
echo   Terminal 2: RemoteX Client
echo.
start cmd /k "cd /d %~dp0server && echo Starting Signaling Server... && npm start"
timeout /t 3
start cmd /k "cd /d %~dp0client && echo Starting RemoteX Client... && npm start"
echo.
echo ========================================
echo Server and Client are starting...
echo.
echo On the OTHER laptop, open:
echo   http://%IP%:5173/?mode=client
echo ========================================
goto :end

:server_only
echo.
echo Starting ONLY Signaling Server on %IP%:3001...
cd /d %~dp0server
npm start
goto :end

:client_only
echo.
echo Enter the server IP address (e.g., 192.168.1.50):
set /p SERVER_IP="Server IP: "
echo.
echo Starting client...
echo Will connect to: http://%SERVER_IP%:3001
echo.
set VITE_SIGNAL_SERVER_URL=http://%SERVER_IP%:3001
cd /d %~dp0client
npm start
goto :end

:end
echo.
echo Press any key to exit...
pause > nul
