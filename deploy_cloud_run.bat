@echo off
setlocal
echo ===================================================
echo   RemoteX - Google Cloud Run Deployment Helper
echo ===================================================
echo.

:: Check if gcloud is installed
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'gcloud' CLI is not found in your PATH.
    echo Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

:: Check for active account
echo Checking gcloud authentication...
call gcloud auth list --filter="status:ACTIVE" --format="value(account)" > temp_auth.txt
set /p ACTIVE_ACCOUNT=<temp_auth.txt
del temp_auth.txt

if "%ACTIVE_ACCOUNT%"=="" (
    echo [!] No active account found. Please login.
    echo Opening browser for authentication...
    call gcloud auth login
) else (
    echo [OK] Authenticated as: %ACTIVE_ACCOUNT%
)

echo.
echo ===================================================
echo   Configuration
echo ===================================================
echo.

:: Get Project ID
echo Available Projects:
call gcloud projects list --format="value(projectId)"
echo.
set /p PROJECT_ID="Enter your Google Cloud Project ID: "

if "%PROJECT_ID%"=="" (
    echo [ERROR] Project ID is required.
    pause
    exit /b 1
)

:: Set Project
call gcloud config set project %PROJECT_ID%

echo.
echo ===================================================
echo   Deploying to Cloud Run
echo ===================================================
echo.
echo Building and deploying from current directory...
echo [INFO] Usage: Service Name [remotex], Region [us-central1]
echo.

call gcloud run deploy remotex ^
    --source . ^
    --platform managed ^
    --region us-central1 ^
    --allow-unauthenticated ^
    --port 3000

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Deployment failed. Check the errors above.
    echo Common issues:
    echo  - API not enabled (run: gcloud services enable run.googleapis.com cloudbuild.googleapis.com)
    echo  - Billing not enabled
    echo.
) else (
    echo.
    echo [SUCCESS] Deployment completed!
    echo You can now access RemoteX at the URL provided above.
)

pause
