# PowerShell script to fix SmartSprint application issues

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$ForegroundColor = "Cyan"
    )
    
    Write-Host ">> $Message" -ForegroundColor $ForegroundColor
}

function Test-ApplicationPort {
    param(
        [int]$Port
    )
    
    $result = netstat -ano | findstr ":$Port"
    return $result
}

function Stop-ApplicationServer {
    param(
        [int]$Port
    )
    
    $processInfo = netstat -ano | findstr ":$Port"
    if ($processInfo) {
        $parts = $processInfo -split '\s+'
        $pid = $parts[-1]
        Write-ColorMessage "Killing process with PID: $pid" "Yellow"
        Stop-Process -Id $pid -Force
        Write-ColorMessage "Process killed" "Green"
    }
}

function Debug-Environment {
    Write-ColorMessage "Debugging environment..." "Cyan"
    
    # Check Node.js and npm versions
    Write-ColorMessage "Node.js version: $(node -v)"
    Write-ColorMessage "npm version: $(npm -v)"
    
    # Check backend dependencies
    if (Test-Path -Path "backend\package.json") {
        Write-ColorMessage "Backend dependencies:"
        Get-Content "backend\package.json" | Select-String -Pattern '"dependencies"' -Context 0,15
    } else {
        Write-ColorMessage "Backend package.json not found" "Red"
        exit 1
    }
    
    # Check frontend dependencies
    if (Test-Path -Path "frontend\package.json") {
        Write-ColorMessage "Frontend dependencies:"
        Get-Content "frontend\package.json" | Select-String -Pattern '"dependencies"' -Context 0,15
    } else {
        Write-ColorMessage "Frontend package.json not found" "Red"
        exit 1
    }
    
    # Check if .env file exists
    if (Test-Path -Path "backend\.env") {
        Write-ColorMessage "Backend .env file exists"
    } else {
        Write-ColorMessage "Creating backend .env file..." "Yellow"
        @"
PORT=5000
NODE_ENV=development
JWT_SECRET=smartsprint_dev_secret
JWT_EXPIRY=7d
DATABASE_PATH=./database/smartsprint.db
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
        Write-ColorMessage "Backend .env file created" "Green"
    }
}

function Setup-Database {
    Write-ColorMessage "Setting up database..." "Cyan"
    
    # Create database directory if it doesn't exist
    if (-not (Test-Path -Path "backend\database")) {
        Write-ColorMessage "Creating database directory..." "Yellow"
        New-Item -Path "backend\database" -ItemType Directory | Out-Null
        Write-ColorMessage "Database directory created" "Green"
    }
    
    # Check if database file exists
    if (Test-Path -Path "backend\database\smartsprint.db") {
        Write-ColorMessage "Database file exists." "Green"
        $resetDb = Read-Host "Do you want to reset the database? (y/n)"
        if ($resetDb -eq "y") {
            Write-ColorMessage "Removing existing database..." "Yellow"
            Remove-Item -Path "backend\database\smartsprint.db" -Force
            Write-ColorMessage "Initializing new database..." "Yellow"
            Set-Location -Path "backend"
            npm run init-db
            Set-Location -Path ".."
            Write-ColorMessage "Database initialized" "Green"
        }
    } else {
        Write-ColorMessage "Initializing new database..." "Yellow"
        Set-Location -Path "backend"
        npm run init-db
        Set-Location -Path ".."
        Write-ColorMessage "Database initialized" "Green"
    }
}

function Repair-NpmIssues {
    Write-ColorMessage "Repairing NPM issues..." "Cyan"
    
    # Clear npm cache
    Write-ColorMessage "Clearing npm cache..." "Yellow"
    npm cache clean --force
    
    # Reinstall backend dependencies
    Write-ColorMessage "Reinstalling backend dependencies..." "Yellow"
    Set-Location -Path "backend"
    if (Test-Path -Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
    }
    if (Test-Path -Path "package-lock.json") {
        Remove-Item -Path "package-lock.json" -Force
    }
    npm install
    Set-Location -Path ".."
    
    # Reinstall frontend dependencies
    Write-ColorMessage "Reinstalling frontend dependencies..." "Yellow"
    Set-Location -Path "frontend"
    if (Test-Path -Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
    }
    if (Test-Path -Path "package-lock.json") {
        Remove-Item -Path "package-lock.json" -Force
    }
    npm install
    Set-Location -Path ".."
    
    Write-ColorMessage "NPM issues repaired" "Green"
}

function Fix-NavbarComponent {
    Write-ColorMessage "Fixing Navbar component..." "Cyan"
    
    # Path to the Navbar.js file
    $navbarPath = "frontend\src\components\layout\Navbar.js"
    
    # Check if the file exists
    if (Test-Path -Path $navbarPath) {
        Write-ColorMessage "Navbar component found. Applying fix..." "Yellow"
        
        # Read the content of the file
        $content = Get-Content -Path $navbarPath -Raw
        
        # Replace the problematic code
        $content = $content -replace '{user\?.team !== .None. \? user\.team : ..}', '{user?.team && user.team !== "None" ? ` • ${user.team}` : ""}'
        
        # Write the content back to the file
        $content | Out-File -FilePath $navbarPath -Encoding utf8
        
        Write-ColorMessage "Navbar component fixed" "Green"
    } else {
        Write-ColorMessage "Navbar component not found" "Red"
    }
}

function Start-Servers {
    Write-ColorMessage "Starting servers..." "Cyan"
    
    # Start backend server
    Write-ColorMessage "Starting backend server..." "Yellow"
    Start-Process -FilePath "cmd" -ArgumentList "/c cd backend && npm run dev"
    Write-ColorMessage "Backend server started" "Green"
    
    # Wait for backend to start
    Start-Sleep -Seconds 5
    
    # Start frontend server
    Write-ColorMessage "Starting frontend server..." "Yellow"
    Start-Process -FilePath "cmd" -ArgumentList "/c cd frontend && npm start"
    Write-ColorMessage "Frontend server started" "Green"
    
    Write-ColorMessage "Servers started. Close the terminal windows to stop the servers." "Green"
}

# Main menu
function Show-Menu {
    Write-Host ""
    Write-Host "SmartSprint Development Troubleshooter" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Check & kill running servers" -ForegroundColor White
    Write-Host "2. Debug environment" -ForegroundColor White
    Write-Host "3. Setup/reset database" -ForegroundColor White
    Write-Host "4. Repair NPM issues" -ForegroundColor White
    Write-Host "5. Fix Navbar component" -ForegroundColor White
    Write-Host "6. Start servers" -ForegroundColor White
    Write-Host "7. Run complete fix" -ForegroundColor White
    Write-Host "8. Exit" -ForegroundColor White
    Write-Host ""
}

function Start-CompleteRepair {
    Write-ColorMessage "Starting complete repair process..." "Magenta"
    
    Debug-Environment
    Setup-Database
    Repair-NpmIssues
    Fix-NavbarComponent
    
    Write-ColorMessage "Complete repair finished. Ready to start servers." "Green"
    
    $startServers = Read-Host "Do you want to start the servers now? (y/n)"
    if ($startServers -eq "y") {
        Start-Servers
    }
}

# Main script execution
$continue = $true
while ($continue) {
    Show-Menu
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" {
            $frontendRunning = Test-ApplicationPort -Port 3000
            if ($frontendRunning) {
                Write-ColorMessage "Frontend server is running on port 3000" "Yellow"
                $killFrontend = Read-Host "Do you want to kill it? (y/n)"
                if ($killFrontend -eq "y") {
                    Stop-ApplicationServer -Port 3000
                }
            } else {
                Write-ColorMessage "No server running on port 3000" "Green"
            }
            
            $backendRunning = Test-ApplicationPort -Port 5000
            if ($backendRunning) {
                Write-ColorMessage "Backend server is running on port 5000" "Yellow"
                $killBackend = Read-Host "Do you want to kill it? (y/n)"
                if ($killBackend -eq "y") {
                    Stop-ApplicationServer -Port 5000
                }
            } else {
                Write-ColorMessage "No server running on port 5000" "Green"
            }
        }
        "2" { Debug-Environment }
        "3" { Setup-Database }
        "4" { Repair-NpmIssues }
        "5" { Fix-NavbarComponent }
        "6" { Start-Servers }
        "7" { Start-CompleteRepair }
        "8" { 
            Write-ColorMessage "Exiting troubleshooter..." "Cyan"
            $continue = $false 
        }
        default { Write-ColorMessage "Invalid choice. Please try again." "Red" }
    }
    
    if ($continue) {
        Write-Host ""
        pause
    }
} 