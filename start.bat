@echo off
chcp 65001 >nul
title Discord Quest Farm
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] Node.js n'est pas installe / Node.js is not installed.
  echo      https://nodejs.org  ^(LTS^)
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Installation des dependances / Installing dependencies...
  call npm install --silent
  if errorlevel 1 (
    echo  [!] npm install a echoue / npm install failed.
    pause
    exit /b 1
  )
)

echo.
echo  http://localhost:3000
echo  Ferme cette fenetre pour tout arreter / Close this window to stop everything.
echo.

start "" "http://localhost:3000"
node server.js

echo.
echo  Serveur arrete / Server stopped.
pause
