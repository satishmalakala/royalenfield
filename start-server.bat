@echo off
title Royal Enfield Zero-Gravity Experience Server
echo ========================================================
echo   ROYAL ENFIELD // ZERO-GRAVITY 3D EXPERIENCE
echo ========================================================
echo Starting local web server on port 8080...

set "NODE_EXE=C:\Program Files\Adobe\Adobe Photoshop 2025\node.exe"
if exist "%NODE_EXE%" (
    echo Using Node.js runtime...
    "%NODE_EXE%" "%~dp0server.js"
) else (
    echo Using PowerShell runtime...
    powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8080
)

pause
