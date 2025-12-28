@echo off
echo ========================================
echo CRASH DEBUGGER
echo ========================================
cd client
echo Starting Node.js Server...
node signaling-server.js
echo.
echo ========================================
echo ERROR: THE SERVER HAS CRASHED OR STOPPED
echo READ THE ERROR MESSAGE ABOVE
echo ========================================
pause
