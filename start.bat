@echo off
echo Starting Rekenavontuur...

start "Backend" cmd /k "cd /d %~dp0 && uvicorn app.main:app --reload"

timeout /t 3 /nobreak > /dev/null

start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Sluit de twee vensters om te stoppen.
