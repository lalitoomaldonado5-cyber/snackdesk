@echo off
title Snackdesk - servidor local
cd /d "%~dp0"

set "SNACKDESK_NODE="
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined SNACKDESK_NODE set "SNACKDESK_NODE=%%N"
if not defined SNACKDESK_NODE set "SNACKDESK_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "SNACKDESK_NEXT=%~dp0node_modules\next\dist\bin\next"

if not exist "%SNACKDESK_NODE%" (
  echo No se encontro Node.js en esta computadora.
  echo Abre README.md y sigue la seccion de requisitos.
  pause
  exit /b 1
)

if not exist "%SNACKDESK_NEXT%" (
  echo Faltan las dependencias de Snackdesk.
  echo Abre una terminal en esta carpeta y ejecuta: npm ci
  pause
  exit /b 1
)

echo Iniciando Snackdesk...
echo Esta ventana debe permanecer abierta mientras uses la aplicacion.
echo Para detener el servidor, presiona Ctrl+C.
echo.

if not exist "%~dp0.next\BUILD_ID" (
  echo Falta compilar Snackdesk. Ejecuta: npm run build
  pause
  exit /b 1
)

start "" /min "%ComSpec%" /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:3000/login"
"%SNACKDESK_NODE%" "%SNACKDESK_NEXT%" start --hostname 127.0.0.1 --port 3000

echo.
echo El servidor se detuvo. Puedes cerrar esta ventana.
pause
