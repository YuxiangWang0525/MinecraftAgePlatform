@echo off
chcp 65001 >nul 2>&1
setlocal

echo ========================================
echo   MCAP Build Script
echo ========================================
echo.

:: Check .env file exists
if not exist .env (
    echo [!] .env file not found, copying from .env.example...
    copy .env.example .env >nul
    echo     Created .env with default values. Please review and edit if needed.
    echo.
)

:: Step 1: Build frontend
echo [1/3] Building frontend...
cd webpanel
call npx vite build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Frontend build failed!
    cd ..
    exit /b 1
)
cd ..
echo Frontend build complete.
echo.

:: Step 2: Build backend
echo [2/3] Building backend...
call npx nest build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Backend build failed!
    exit /b 1
)
echo Backend build complete.
echo.

:: Step 3: Copy frontend dist to backend dist/public
echo [3/3] Copying frontend to backend...
if exist dist\public rmdir /s /q dist\public
xcopy /e /i /q /y webpanel\dist dist\public >nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to copy frontend files!
    exit /b 1
)
echo Copy complete.
echo.

echo ========================================
echo   Build successful!
echo ========================================
echo.
echo   Output:  dist\
echo   Start:   node --env-file=.env dist\main.js
echo   URL:     http://localhost:3000 (or configured APP_URL)
echo.

endlocal
