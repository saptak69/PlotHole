@echo off
echo ========================================================
echo   STARTING PLOTHOLE CINEMA CHRONICLES (LOCAL SERVERS)
echo ========================================================
echo.

echo Starting Backend Server on http://localhost:5000...
start "PlotHole Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend Server on http://localhost:5173...
start "PlotHole Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend URL: http://localhost:5173
echo Backend URL:  http://localhost:5000
echo.
pause
