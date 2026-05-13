@echo off
REM ╔════════════════════════════════════════════════════════╗
REM ║  Smart Mobility AI Backend - Quick Start (Windows)     ║
REM ║  Run this script to start the AI backend                ║
REM ╚════════════════════════════════════════════════════════╝

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🚀 Smart Mobility AI Backend Launcher               ║
echo ║  Version: 3.0 - Ultra Intelligent                     ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM ═════════════════════════════════════════════════════════
REM Check Python is installed
REM ═════════════════════════════════════════════════════════

echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python from https://www.python.org
    echo    Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
echo ✅ Python found
echo.

REM ═════════════════════════════════════════════════════════
REM Install dependencies
REM ═════════════════════════════════════════════════════════

echo [2/5] Installing dependencies...
echo       (This may take a minute on first run)
python -m pip install flask flask-cors python-dotenv requests --quiet
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo    Try running in Administrator mode
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM ═════════════════════════════════════════════════════════
REM Check backend file exists
REM ═════════════════════════════════════════════════════════

echo [3/5] Checking backend files...
if not exist "smart_mobility_ai_backend.py" (
    echo ❌ smart_mobility_ai_backend.py not found!
    echo    Make sure you're in the backend directory
    pause
    exit /b 1
)
echo ✅ Backend file found
echo.

REM ═════════════════════════════════════════════════════════
REM Check port is available
REM ═════════════════════════════════════════════════════════

echo [4/5] Checking port 5001...
netstat -ano | findstr ":5001" >nul
if errorlevel 0 (
    echo ⚠️  Port 5001 might be in use. Trying anyway...
)
echo ✅ Port check complete
echo.

REM ═════════════════════════════════════════════════════════
REM Start backend
REM ═════════════════════════════════════════════════════════

echo [5/5] Starting Smart Mobility AI Backend...
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🌐 Backend Running at: http://localhost:5001         ║
echo ║                                                        ║
echo ║  📊 Available Endpoints:                              ║
echo ║  - GET /api/health                                   ║
echo ║  - GET /api/transport/status                         ║
echo ║  - GET /api/stress/current-level                     ║
echo ║  - GET /api/environment/co2-stats                    ║
echo ║  - GET /api/weather/current                          ║
echo ║  - GET /api/infra/status                             ║
echo ║  - GET /api/alerts/active                            ║
echo ║  - GET /api/user/stats                               ║
echo ║  - GET /api/user/ranking                             ║
echo ║  - GET /api/predictions/next-hour                    ║
echo ║  - GET /api/context/all                              ║
echo ║                                                        ║
echo ║  🧠 AI Assistant:                                     ║
echo ║  - Open http://localhost:4200/client                 ║
echo ║  - Click the 🤖 chat button                          ║
echo ║  - Ask: "Quel trajet me recommandes-tu?"            ║
echo ║                                                        ║
echo ║  ⏹️  To stop: Press Ctrl+C                            ║
echo ╚════════════════════════════════════════════════════════╝
echo.

python app.py

REM If we get here, Python exited
echo.
echo ❌ Backend stopped
pause
