# Zerox OCR Deployment Script for Windows
# This script sets up the Zerox OCR environment

Write-Host "=== Zerox OCR Deployment Script ===" -ForegroundColor Green

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.11 or later." -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (Test-Path ".venv") {
    Write-Host "Virtual environment found." -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    Write-Host "Virtual environment created." -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install -r zerox/pyproject.toml

# Check if poppler is installed
Write-Host "Checking poppler installation..." -ForegroundColor Yellow
try {
    $popplerPath = Get-ChildItem "C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages" -Name "*poppler*" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($popplerPath) {
        Write-Host "Poppler found in WinGet packages." -ForegroundColor Green
        $popplerBinPath = "C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\$popplerPath\Library\bin"
        $env:PATH += ";$popplerBinPath"
        Write-Host "Poppler added to PATH." -ForegroundColor Green
    } else {
        Write-Host "Poppler not found. Installing via WinGet..." -ForegroundColor Yellow
        winget install oschwartz10612.Poppler
        Write-Host "Poppler installed. Please restart your terminal to use it." -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking/installing poppler: $_" -ForegroundColor Red
}

# Create output directory
if (!(Test-Path "output_test")) {
    New-Item -ItemType Directory -Name "output_test"
    Write-Host "Created output_test directory." -ForegroundColor Green
}

# Test installation
Write-Host "Testing installation..." -ForegroundColor Yellow
try {
    python -c "import sys; sys.path.insert(0, 'zerox/py_zerox'); from pyzerox.core.zerox import zerox; print('Zerox import successful')"
    Write-Host "Installation test passed!" -ForegroundColor Green
} catch {
    Write-Host "Installation test failed: $_" -ForegroundColor Red
}

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set your API key: `$env:GEMINI_API_KEY='your-api-key'" -ForegroundColor White
Write-Host "2. Run the OCR: python run_zerox.py" -ForegroundColor White
Write-Host "3. Check output in output_test directory" -ForegroundColor White
