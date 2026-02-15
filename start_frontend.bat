@echo off
echo Starting RAG Frontend...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
)

REM Start the development server
echo.
echo Starting React development server on http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
npm run dev
