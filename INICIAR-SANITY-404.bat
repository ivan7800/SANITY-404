@echo off
setlocal
set "BASE=%~dp0"
if not exist "%BASE%game\index.html" (
  echo Faltan los recursos del juego.
  exit /b 2
)
if not exist "%BASE%sanity404-server.exe" (
  echo Falta el servidor portable.
  exit /b 2
)
"%BASE%sanity404-server.exe" --launch "%BASE%game"
exit /b %errorlevel%
