@echo off
set PATH=C:\Users\ShivaDosala\AppData\Local\nvm\v18.17.1;%PATH%
cd /d C:\Users\ShivaDosala\Desktop\RemoteX\client
npx @electron/rebuild -f -w robotjs
echo rebuild finished
pause
