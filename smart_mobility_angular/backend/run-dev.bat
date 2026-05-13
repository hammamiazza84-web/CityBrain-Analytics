@echo off
cd /d "%~dp0"
echo pip install -r requirements.txt
if "%OPENAI_API_KEY%"=="" echo ATTENTION: definissez OPENAI_API_KEY avant de lancer.
python -m uvicorn main:app --host 127.0.0.1 --port 5004
pause
