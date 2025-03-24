# PowerShell script to fix CORS issues in SmartSprint application

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

function Setup-CorsEnvironment {
    Write-ColorMessage "Setting up environment variables for CORS..." "Cyan"
    
    # Check for .env file
    if (Test-Path -Path "backend\.env") {
        $envContent = Get-Content -Path "backend\.env" -Raw
        
        # Add CORS_ORIGIN if not already present
        if (-not ($envContent -match "CORS_ORIGIN")) {
            Write-ColorMessage "Adding CORS_ORIGIN to .env file..." "Yellow"
            Add-Content -Path "backend\.env" -Value "`nCORS_ORIGIN=*"
            Write-ColorMessage "CORS_ORIGIN added to .env file" "Green"
        }
    } else {
        Write-ColorMessage "Creating .env file with CORS configuration..." "Yellow"
        @"
PORT=5000
NODE_ENV=development
JWT_SECRET=smartsprint_dev_secret
JWT_EXPIRY=7d
DATABASE_PATH=./database/smartsprint.db
CORS_ORIGIN=*
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
        Write-ColorMessage ".env file created with CORS configuration" "Green"
    }
}

function Fix-BackendCors {
    Write-ColorMessage "Fixing backend CORS configuration..." "Cyan"
    
    # Check if server.js exists
    if (Test-Path -Path "backend\src\server.js") {
        $serverContent = Get-Content -Path "backend\src\server.js" -Raw
        
        # Check if CORS is properly configured
        if ($serverContent -match "app.use\(cors\(\)\)") {
            Write-ColorMessage "Updating CORS configuration in server.js..." "Yellow"
            $updatedContent = $serverContent -replace "app.use\(cors\(\)\);", @"
// Enhanced CORS configuration for GitHub Codespaces
const corsOptions = {
  origin: function (origin, callback) {
    // Allow any origin that includes github.dev, localhost, or is undefined (for same-origin requests)
    const allowedOrigins = [
      /^https:\/\/.*\.app\.github\.dev$/,
      /^https:\/\/.*\.github\.dev$/,
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/localhost:\d+$/
    ];
    
    const isAllowed = !origin || allowedOrigins.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Timestamp']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
"@
            
            $updatedContent | Out-File -FilePath "backend\src\server.js" -Encoding utf8
            Write-ColorMessage "CORS configuration updated in server.js" "Green"
        } else {
            Write-ColorMessage "CORS configuration already present in server.js" "Green"
        }
    } else {
        Write-ColorMessage "server.js not found!" "Red"
    }
}

function Fix-FrontendCors {
    Write-ColorMessage "Fixing frontend CORS configuration..." "Cyan"
    
    # Check if index.html exists
    if (Test-Path -Path "frontend\public\index.html") {
        $indexContent = Get-Content -Path "frontend\public\index.html" -Raw
        
        # Check if CSP headers are already present
        if (-not ($indexContent -match "Content-Security-Policy")) {
            Write-ColorMessage "Adding CSP headers to index.html..." "Yellow"
            $updatedContent = $indexContent -replace "(<meta\s+name=\"description\"\s+content=\".*?\"\s*/>)", @"
$1
    <!-- CSP headers for GitHub Codespaces -->
    <meta http-equiv="Content-Security-Policy" content="
      default-src 'self'; 
      connect-src 'self' https://*.github.dev http://localhost:* https://localhost:*; 
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.github.dev;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://*.github.dev;
    ">
"@
            
            $updatedContent | Out-File -FilePath "frontend\public\index.html" -Encoding utf8
            Write-ColorMessage "CSP headers added to index.html" "Green"
        } else {
            Write-ColorMessage "CSP headers already present in index.html" "Green"
        }
        
        # Update manifest.json link
        if (-not ($indexContent -match "crossorigin=\"use-credentials\"")) {
            Write-ColorMessage "Updating manifest.json link..." "Yellow"
            $updatedContent = $indexContent -replace "(<link rel=\"manifest\" href=\"%PUBLIC_URL%/manifest.json\")", "$1 crossorigin=\"use-credentials\""
            $updatedContent | Out-File -FilePath "frontend\public\index.html" -Encoding utf8
            Write-ColorMessage "manifest.json link updated" "Green"
        } else {
            Write-ColorMessage "manifest.json link already has crossorigin attribute" "Green"
        }
    } else {
        Write-ColorMessage "index.html not found!" "Red"
    }
    
    # Check if manifest.json exists
    if (Test-Path -Path "frontend\public\manifest.json") {
        $manifestContent = Get-Content -Path "frontend\public\manifest.json" -Raw
        
        # Update start_url in manifest.json
        if ($manifestContent -match "\"start_url\": \"\.\",") {
            Write-ColorMessage "Updating start_url in manifest.json..." "Yellow"
            $updatedContent = $manifestContent -replace "\"start_url\": \"\.\",", "\"start_url\": \"./\",`n  \"scope\": \"./\","
            $updatedContent | Out-File -FilePath "frontend\public\manifest.json" -Encoding utf8
            Write-ColorMessage "start_url updated in manifest.json" "Green"
        } else {
            Write-ColorMessage "start_url already properly configured in manifest.json" "Green"
        }
    } else {
        Write-ColorMessage "manifest.json not found!" "Red"
    }
}

function Start-FixedServers {
    Write-ColorMessage "Starting servers with fixed CORS configuration..." "Cyan"
    
    # Check if any processes are already running on the required ports
    $frontendRunning = Test-ApplicationPort -Port 3000
    if ($frontendRunning) {
        Write-ColorMessage "Stopping existing frontend server..." "Yellow"
        Stop-ApplicationServer -Port 3000
    }
    
    $backendRunning = Test-ApplicationPort -Port 5000
    if ($backendRunning) {
        Write-ColorMessage "Stopping existing backend server..." "Yellow"
        Stop-ApplicationServer -Port 5000
    }
    
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
    
    Write-ColorMessage "Servers started with fixed CORS configuration." "Green"
    Write-ColorMessage "Close the terminal windows to stop the servers." "Green"
}

function Start-CompleteCorsRepair {
    Write-ColorMessage "Starting complete CORS repair..." "Magenta"
    
    Setup-CorsEnvironment
    Fix-BackendCors
    Fix-FrontendCors
    
    Write-ColorMessage "CORS repairs complete. Ready to start servers." "Green"
    
    $startServers = Read-Host "Do you want to start the servers now? (y/n)"
    if ($startServers -eq "y") {
        Start-FixedServers
    }
}

# GitHub Codespaces specific fix
function Fix-GitHubCodespaces {
    Write-Host "Applying GitHub Codespaces specific CORS fixes..." -ForegroundColor Cyan
    
    # Fix the frontend CORS and CSP issues
    Push-Location -Path "frontend"
    try {
        # Update the index.html to remove any existing CSP meta tags and add a permissive one
        $indexHtml = Get-Content -Path "public\index.html" -Raw
        $indexHtml = $indexHtml -replace '<meta http-equiv="Content-Security-Policy".*?>', ''
        
        $cspTag = '<meta http-equiv="Content-Security-Policy" content="default-src * self blob: data: gap:; style-src * self ''unsafe-inline'' blob: data: gap:; script-src * ''unsafe-eval'' ''unsafe-inline'' blob: data: gap:; object-src * ''unsafe-inline'' blob: data: gap:; img-src * self ''unsafe-inline'' blob: data: gap:; connect-src self * ''unsafe-inline'' blob: data: gap:; frame-src * self blob: data: gap:;">'
        $indexHtml = $indexHtml -replace '(<head>)', "`$1`n  $cspTag"
        Set-Content -Path "public\index.html" -Value $indexHtml
        
        # Create or update the setupProxy.js file
        New-Item -Path "src" -ItemType Directory -Force | Out-Null
        $proxyContent = @"
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Determine the backend URL based on the environment
  const getBackendUrl = () => {
    const hostname = process.env.HOSTNAME || '';
    
    // Check if running in GitHub Codespaces
    if (hostname.includes('github.dev') || hostname.includes('app.github.dev')) {
      // Extract the codespace name from the hostname
      const codespaceNameMatch = hostname.match(/(.*?)-\d+/);
      const codespaceName = codespaceNameMatch ? codespaceNameMatch[1] : '';
      
      // Construct the backend URL for GitHub Codespaces
      return `https://\${codespaceName}-5000.app.github.dev`;
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
  };

  const backendUrl = getBackendUrl();
  console.log(`Proxying API requests to: \${backendUrl}`);

  // Configure proxy for API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false, // Ignore SSL certificate errors
      pathRewrite: { '^/api': '/api' },
      logLevel: 'debug'
    })
  );

  // Also proxy debug endpoints
  app.use(
    '/debug',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug'
    })
  );

  // Proxy for health check
  app.use(
    '/health',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false
    })
  );
};
"@
        Set-Content -Path "src\setupProxy.js" -Value $proxyContent
        
        # Add http-proxy-middleware to package.json if not present
        $packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
        
        if (-not ($packageJson.devDependencies.PSObject.Properties.Name -contains "http-proxy-middleware")) {
            $packageJson.devDependencies | Add-Member -Name "http-proxy-middleware" -Value "^2.0.6" -MemberType NoteProperty
            $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "package.json"
        }
        
        Write-Host "Frontend CORS fixes applied." -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    
    # Fix the backend CORS configuration
    Push-Location -Path "backend"
    try {
        # Ensure CORS_ORIGIN=* in .env
        if (Test-Path ".env") {
            $envContent = Get-Content -Path ".env" -Raw
            if ($envContent -match "CORS_ORIGIN=") {
                $envContent = $envContent -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=*"
            }
            else {
                $envContent += "`nCORS_ORIGIN=*"
            }
            Set-Content -Path ".env" -Value $envContent
        }
        else {
            Set-Content -Path ".env" -Value "CORS_ORIGIN=*"
        }
        
        # Update server.js to include comprehensive CORS handling
        $corsMiddlewareContent = @"
const setupCors = (app) => {
  app.use((req, res, next) => {
    // Allow all origins for GitHub Codespaces
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });
};

module.exports = setupCors;
"@
        Set-Content -Path "src\cors-middleware.js" -Value $corsMiddlewareContent
        
        # Inject the cors-middleware.js into server.js if not already there
        $serverJs = Get-Content -Path "src\server.js" -Raw
        if ($serverJs -notmatch "setupCors") {
            $serverJs = $serverJs -replace "app.use\(cors\(corsOptions\)\);", "const setupCors = require('./cors-middleware');`napp.use(cors(corsOptions));`nsetupCors(app);"
            Set-Content -Path "src\server.js" -Value $serverJs
        }
        
        Write-Host "Backend CORS fixes applied." -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
    
    Write-Host "GitHub Codespaces CORS fixes completed. You may need to restart your servers." -ForegroundColor Yellow
}

# Main menu
function Show-Menu {
    Write-Host ""
    Write-Host "SmartSprint CORS Issue Fixer" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Check & kill running servers" -ForegroundColor White
    Write-Host "2. Setup CORS environment variables" -ForegroundColor White
    Write-Host "3. Fix backend CORS configuration" -ForegroundColor White
    Write-Host "4. Fix frontend CORS configuration" -ForegroundColor White
    Write-Host "5. Start servers" -ForegroundColor White
    Write-Host "6. Run complete CORS fix" -ForegroundColor White
    Write-Host "7. GitHub Codespaces specific fix" -ForegroundColor White
    Write-Host "8. Exit" -ForegroundColor White
    Write-Host ""
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
        "2" { Setup-CorsEnvironment }
        "3" { Fix-BackendCors }
        "4" { Fix-FrontendCors }
        "5" { Start-FixedServers }
        "6" { Start-CompleteCorsRepair }
        "7" { Fix-GitHubCodespaces }
        "8" { 
            Write-ColorMessage "Exiting CORS fixer..." "Cyan"
            $continue = $false 
        }
        default { Write-ColorMessage "Invalid choice. Please try again." "Red" }
    }
    
    if ($continue) {
        Write-Host ""
        pause
    }
} 