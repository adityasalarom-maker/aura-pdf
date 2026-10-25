@echo off
title AuraPDF — Desktop & Galaxy S25 Ultra Launcher
color 0B
echo ======================================================================
echo           AuraPDF — Multilingual Reader & Obsidian Capture
echo ======================================================================
echo.

:: Get local Wi-Fi IPv4 address dynamically
for /f "tokens=4" %%a in ('route print ^| findstr " 0.0.0.0.*10\." 2^>nul') do (set LOCAL_IP=%%a)
if "%LOCAL_IP%"=="" (
  for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" 2^>nul') do (
    set LOCAL_IP=%%a
  )
)
:: Strip spaces
set LOCAL_IP=%LOCAL_IP: =%
if "%LOCAL_IP%"=="" set LOCAL_IP=10.47.25.200

echo [1/3] Starting Local Server on port 8000...
start /B python -m http.server 8000 >nul 2>&1
timeout /t 1 >nul

echo [2/3] Desktop Access (Windows 11):
echo       http://localhost:8000
echo.
echo [3/3] Galaxy S25 Ultra Mobile Access:
echo       ====================================================
echo       👉 Option A (Cloud HTTPS - Works on 5G or Any Wi-Fi):
echo          https://aurapdf-aditya.loca.lt
echo          (If asked for password, enter your IP: 47.15.112.206)
echo.
echo       👉 Option B (Direct Local Wi-Fi):
echo          http://%LOCAL_IP%:8000
echo       ====================================================
echo.

:: Launch Edge in Native Frameless App Mode
start msedge --app=http://localhost:8000 2>nul || start http://localhost:8000

echo AuraPDF is running in the background. Keep this window open while reading.
echo.
pause
