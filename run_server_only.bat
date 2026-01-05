cd /d "%~dp0\server"
echo Starting Node.js Server from: %CD%
echo Logging to server_debug.log
if not exist node_modules (
    echo Installing server dependencies...
    call npm install
)
node server.js
echo.
echo ========================================
echo ERROR: SERVER STOPPED
echo ========================================
pause
