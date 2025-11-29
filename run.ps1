# MicroGate - Quick Start Script
# Runs both backend and frontend servers

param(
    [switch]$Agent,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Color {
    param(
        [string]$Color,
        [string]$Prefix,
        [string]$Message
    )
    Write-Host "[$Prefix] " -ForegroundColor $Color -NoNewline
    Write-Host $Message
}

function Write-Success { Write-Color Green "✓" $args[0] }
function Write-Info { Write-Color Cyan "INFO" $args[0] }
function Write-Warning { Write-Color Yellow "WARN" $args[0] }
function Write-Error-Custom { Write-Color Red "ERROR" $args[0] }

if ($Help) {
    Write-Host ""
    Write-Host "MicroGate - System Runner" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\run.ps1           # Start backend and frontend"
    Write-Host "  .\run.ps1 -Agent    # Also run the AI agent"
    Write-Host "  .\run.ps1 -Help     # Show this help message"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MicroGate - AI Agent Payment System" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

# Pre-flight checks
Write-Info "Running pre-flight checks..."

$allChecksPass = $true

# Check backend .env
if (-not (Test-Path (Join-Path $backendDir ".env"))) {
    Write-Error-Custom "Backend .env file not found"
    Write-Warning "Copy backend\.env.example to backend\.env and configure it"
    $allChecksPass = $false
}

# Check frontend .env
if (-not (Test-Path (Join-Path $frontendDir ".env"))) {
    Write-Error-Custom "Frontend .env file not found"
    Write-Warning "Copy frontend\.env.example to frontend\.env and configure it"
    $allChecksPass = $false
}

# Check backend node_modules
if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
    Write-Error-Custom "Backend dependencies not installed"
    Write-Warning "Run: cd backend; npm install"
    $allChecksPass = $false
}

# Check frontend node_modules
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Error-Custom "Frontend dependencies not installed"
    Write-Warning "Run: cd frontend; npm install"
    $allChecksPass = $false
}

if (-not $allChecksPass) {
    Write-Host ""
    Write-Error-Custom "Pre-flight checks failed. Please fix the issues above."
    exit 1
}

Write-Success "All pre-flight checks passed!"
Write-Host ""

# Function to cleanup on exit
$jobs = @()

function Cleanup {
    Write-Host ""
    Write-Warning "Stopping all processes..."
    
    foreach ($job in $jobs) {
        if ($job -and $job.State -eq 'Running') {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Success "All processes stopped. Goodbye! 👋"
}

# Register cleanup on Ctrl+C
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

try {
    # Start backend
    Write-Info "Starting backend server..."
    $backendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm start
    } -ArgumentList $backendDir
    $jobs += $backendJob
    Write-Success "Backend server started"

    # Wait for backend to initialize
    Start-Sleep -Seconds 3

    # Start frontend
    Write-Info "Starting frontend development server..."
    $frontendJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        npm run dev
    } -ArgumentList $frontendDir
    $jobs += $frontendJob
    Write-Success "Frontend server started"

    # Wait for frontend to initialize
    Start-Sleep -Seconds 3

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Success "MicroGate is running!"
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Info "Backend API:        http://localhost:3000"
    Write-Info "Frontend Dashboard: http://localhost:5173"
    Write-Info "Health Check:       http://localhost:3000/api/health"
    Write-Host ""
    Write-Warning "Press Ctrl+C to stop all processes"
    Write-Host ""

    # Start agent if requested
    if ($Agent) {
        Write-Host ""
        Write-Info "Starting AI agent..."
        Start-Sleep -Seconds 2
        $agentJob = Start-Job -ScriptBlock {
            param($dir)
            Set-Location $dir
            npm run agent
        } -ArgumentList $backendDir
        $jobs += $agentJob
        Write-Success "Agent started"
    } else {
        Write-Host ""
        Write-Color Magenta "TIP" "To run the AI agent: cd backend; npm run agent"
        Write-Host ""
    }

    # Monitor jobs and display output
    while ($true) {
        foreach ($job in $jobs) {
            if ($job.State -eq 'Running') {
                $output = Receive-Job $job -ErrorAction SilentlyContinue
                if ($output) {
                    $output | ForEach-Object {
                        if ($job -eq $backendJob) {
                            Write-Color Green "BACKEND" $_
                        } elseif ($job -eq $frontendJob) {
                            Write-Color Cyan "FRONTEND" $_
                        } elseif ($job -eq $agentJob) {
                            Write-Color Magenta "AGENT" $_
                        }
                    }
                }
            } elseif ($job.State -eq 'Failed' -or $job.State -eq 'Stopped') {
                Write-Error-Custom "$($job.Name) has stopped unexpectedly"
                throw "Job failed"
            }
        }
        Start-Sleep -Milliseconds 500
    }

} catch {
    Write-Error-Custom "An error occurred: $_"
} finally {
    Cleanup
}
