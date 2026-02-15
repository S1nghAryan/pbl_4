@echo off
echo Starting RAG Backend Server...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the Flask server
echo.
echo Starting Flask server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
python backend.py
