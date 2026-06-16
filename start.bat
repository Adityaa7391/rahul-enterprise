@echo off
echo.
echo ======================================
echo   Rahul Enterprise - Full Stack Setup
echo ======================================
echo.

echo Installing backend dependencies...
cd backend
call npm install
echo Backend installed!

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install
echo Frontend installed!

echo.
echo Seeding database with sample data...
cd ..\backend
call npm run seed

echo.
echo ======================================
echo   Starting servers...
echo ======================================
echo.
echo Backend  - http://localhost:5000
echo Frontend - http://localhost:3000
echo.

start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm start"

echo Both servers starting in separate windows!
pause
