#!/bin/bash

# Colors for terminal output
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${CYAN}>> $1${NC}"
}

print_success() {
  echo -e "${GREEN}>> $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}>> $1${NC}"
}

print_error() {
  echo -e "${RED}>> $1${NC}"
}

# Check if a port is in use
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
    return 0
  else
    return 1
  fi
}

# Stop process on a port
stop_process() {
  print_warning "Stopping process on port $1..."
  lsof -ti:$1 | xargs kill -9
  print_success "Process killed"
}

# Setup CORS environment variables
setup_cors_env() {
  print_message "Setting up environment variables for CORS..."
  
  if [ -f backend/.env ]; then
    if ! grep -q "CORS_ORIGIN" backend/.env; then
      print_warning "Adding CORS_ORIGIN to .env file..."
      echo "CORS_ORIGIN=*" >> backend/.env
      print_success "CORS_ORIGIN added to .env file"
    fi
  else
    print_warning "Creating .env file with CORS configuration..."
    cat > backend/.env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=smartsprint_dev_secret
JWT_EXPIRY=7d
DATABASE_PATH=./database/smartsprint.db
CORS_ORIGIN=*
EOF
    print_success ".env file created with CORS configuration"
  fi
}

# Fix backend CORS configuration
fix_backend_cors() {
  print_message "Fixing backend CORS configuration..."

  if [ -f backend/src/server.js ]; then
    # Check if CORS is already configured
    if grep -q "app.use(cors());" backend/src/server.js || grep -q "app.use(cors(corsOptions));" backend/src/server.js; then
      print_warning "Updating CORS configuration in server.js..."
      
      # First, try to remove any existing corsOptions
      sed -i '/const corsOptions/,/app.options/d' backend/src/server.js || true
      
      # Then replace simple CORS with enhanced configuration
      sed -i 's/app.use(cors());/\/\/ Enhanced CORS configuration for GitHub Codespaces\nconst corsOptions = {\n  origin: "*",\n  credentials: true,\n  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],\n  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"],\n  exposedHeaders: ["Content-Length", "X-Timestamp", "Access-Control-Allow-Origin"]\n};\n\napp.use(cors(corsOptions));\napp.options("*", cors(corsOptions));\n\n\/\/ Add CORS headers to all responses\napp.use((req, res, next) => {\n  res.header("Access-Control-Allow-Origin", "*");\n  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");\n  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");\n  res.header("Access-Control-Allow-Credentials", "true");\n  next();\n});\n/g' backend/src/server.js
      
      print_success "CORS configuration updated in server.js"
    else
      print_success "CORS configuration already present in server.js"
    fi
  else
    print_error "server.js not found!"
  fi
}

# Fix frontend CORS configuration
fix_frontend_cors() {
  print_message "Fixing frontend CORS configuration..."
  
  # Check if index.html exists
  if [ -f frontend/public/index.html ]; then
    # Add more permissive CSP headers
    print_warning "Adding improved CSP headers to index.html..."
    
    # First remove any existing CSP meta tags
    sed -i '/<meta http-equiv="Content-Security-Policy"/d' frontend/public/index.html
    
    # Then add the new one after the description meta tag
    sed -i '/<meta\s\+name="description"/a \    <!-- CSP headers for GitHub Codespaces -->\n    <meta http-equiv="Content-Security-Policy" content="default-src * data: blob: filesystem: about: ws: wss: '\''unsafe-inline'\'' '\''unsafe-eval'\''; script-src * data: blob: '\''unsafe-inline'\'' '\''unsafe-eval'\''; connect-src * data: blob: '\''unsafe-inline'\''; img-src * data: blob: '\''unsafe-inline'\''; frame-src *; style-src * '\''unsafe-inline'\''; font-src * data: blob: '\''unsafe-inline'\'';">' frontend/public/index.html
    
    print_success "CSP headers updated in index.html"
    
    # Update manifest.json link
    if ! grep -q 'crossorigin="use-credentials"' frontend/public/index.html; then
      print_warning "Updating manifest.json link..."
      
      sed -i 's/<link rel="manifest" href="%PUBLIC_URL%\/manifest.json"/<link rel="manifest" href="%PUBLIC_URL%\/manifest.json" crossorigin="use-credentials"/g' frontend/public/index.html
      
      print_success "manifest.json link updated"
    else
      print_success "manifest.json link already has crossorigin attribute"
    fi
  else
    print_error "index.html not found!"
  fi
  
  # Check if manifest.json exists
  if [ -f frontend/public/manifest.json ]; then
    # Update start_url in manifest.json
    print_warning "Updating manifest.json configuration..."
    
    # Create a totally new manifest.json with correct paths
    cat > frontend/public/manifest.json << EOF
{
  "short_name": "SmartSprint",
  "name": "SmartSprint - AI-Enhanced Project Management",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "/logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "theme_color": "#1976d2",
  "background_color": "#ffffff"
}
EOF
    
    print_success "manifest.json configuration updated"
  else
    print_error "manifest.json not found!"
  fi
}

# Add a special route handler for manifest.json
add_manifest_route() {
  print_message "Adding special route handler for manifest.json..."

  if [ -f backend/src/server.js ]; then
    # Check if manifest route is already added
    if ! grep -q "/manifest.json" backend/src/server.js; then
      print_warning "Adding manifest.json route to server.js..."
      
      # Add the route after CORS setup
      sed -i '/app.options/a \
// Special route to handle manifest.json requests\
app.get("/manifest.json", (req, res) => {\
  // Default manifest data\
  const manifest = {\
    short_name: "SmartSprint",\
    name: "SmartSprint - AI-Enhanced Project Management",\
    icons: [\
      {\
        src: "favicon.ico",\
        sizes: "64x64 32x32 24x24 16x16",\
        type: "image/x-icon"\
      },\
      {\
        src: "/logo192.png",\
        type: "image/png",\
        sizes: "192x192"\
      },\
      {\
        src: "/logo512.png",\
        type: "image/png",\
        sizes: "512x512"\
      }\
    ],\
    start_url: "./",\
    scope: "./",\
    display: "standalone",\
    theme_color: "#1976d2",\
    background_color: "#ffffff"\
  };\
  \
  res.set("Access-Control-Allow-Origin", "*");\
  res.set("Content-Type", "application/json");\
  res.json(manifest);\
});\
\
// Special route to handle logo files from manifest\
app.get("/logo:size.png", (req, res) => {\
  res.set("Access-Control-Allow-Origin", "*");\
  res.set("Content-Type", "image/png");\
  res.sendStatus(204); // No content, but OK response\
});\
' backend/src/server.js
      
      print_success "manifest.json and logo routes added to server.js"
    else
      print_success "manifest.json route already exists in server.js"
    fi
  else
    print_error "server.js not found!"
  fi
}

# Update AuthContext to handle GitHub Codespaces
update_auth_context() {
  print_message "Updating AuthContext to handle GitHub Codespaces..."

  if [ -f frontend/src/context/AuthContext.js ]; then
    # Check if dynamic API URL detection is already implemented
    if ! grep -q "determineBaseUrl" frontend/src/context/AuthContext.js; then
      print_warning "Adding dynamic API URL detection to AuthContext..."
      
      # Replace the static baseURL with dynamic detection
      sed -i 's/axios.defaults.baseURL = .*$/const determineBaseUrl = () => {\n  const hostname = window.location.hostname;\n  \n  \/\/ Check if running in GitHub Codespaces\n  if (hostname.includes("github.dev") || hostname.includes("app.github.dev")) {\n    \/\/ Extract the codespace name from the hostname\n    const codespaceNameMatch = hostname.match(\/(.*?)-\\d+\\.app\\.github\\.dev\/);\n    const codespaceName = codespaceNameMatch ? codespaceNameMatch[1] : "";\n    \n    \/\/ Construct the backend URL for GitHub Codespaces\n    return `https:\/\/${codespaceName}-5000.app.github.dev\/api`;\n  }\n  \n  \/\/ Development environment\n  return "http:\/\/localhost:5000\/api";\n};\n\nconst [baseUrl] = useState(determineBaseUrl());\n\n\/\/ Log the base URL for debugging\nconsole.log("API Base URL:", baseUrl);\n\n\/\/ Set up axios defaults\naxios.defaults.baseURL = baseUrl;\naxios.defaults.withCredentials = true; \/\/ Enable sending cookies with requests/g' frontend/src/context/AuthContext.js
      
      # Export baseUrl in the provider value
      sed -i 's/value={{\s*user,\s*token,\s*loading,\s*error,\s*login,\s*register,\s*logout,\s*changePassword\s*}}/value={{\n        user,\n        token,\n        loading,\n        error,\n        login,\n        register,\n        logout,\n        changePassword,\n        baseUrl\n      }}/g' frontend/src/context/AuthContext.js
      
      print_success "Dynamic API URL detection added to AuthContext"
    else
      print_success "Dynamic API URL detection already exists in AuthContext"
    fi
    
    # Now add axios interceptors with better error handling 
    if ! grep -q "axios.interceptors.request.use" frontend/src/context/AuthContext.js; then
      print_warning "Adding improved axios interceptors to AuthContext..."
      
      # Find the spot after setting axios defaults
      sed -i '/axios.defaults.withCredentials = true/a \
  \
  // Add request interceptor to handle errors and authentication\
  axios.interceptors.request.use(\
    (config) => {\
      // Add CORS headers to all requests\
      config.headers["X-Requested-With"] = "XMLHttpRequest";\
      return config;\
    },\
    (error) => {\
      return Promise.reject(error);\
    }\
  );\
\
  // Add response interceptor to handle CORS errors\
  axios.interceptors.response.use(\
    (response) => {\
      return response;\
    },\
    (error) => {\
      console.error("API Error:", error);\
      // Network or CORS error\
      if (error.message === "Network Error") {\
        console.error("CORS or Network Error detected");\
      }\
      return Promise.reject(error);\
    }\
  );' frontend/src/context/AuthContext.js
      
      print_success "Axios interceptors added to AuthContext"
    else
      print_success "Axios interceptors already exist in AuthContext"
    fi
  else
    print_error "AuthContext.js not found!"
  fi
}

# Fix Login component for better error handling
fix_login_component() {
  print_message "Fixing Login component for better error handling..."

  if [ -f frontend/src/components/auth/Login.js ]; then
    # Add improved error handling
    if ! grep -q "CORS error detected" frontend/src/components/auth/Login.js; then
      print_warning "Updating Login component with better error handling..."
      
      # Add function to open backend connection
      sed -i '/const onSubmit/i \
  // Helper function to open backend URL in a new tab\
  const openBackendUrl = () => {\
    window.open(baseUrl, "_blank");\
  };' frontend/src/components/auth/Login.js
      
      # Add CORS error detection to the catch block
      sed -i 's/console.error.\"Login error:\".*error.;/console.error("Login error:", error);\
      setIsSubmitting(false);\
      // If we get a CORS error, show a more helpful message\
      if (error.message?.includes("Network Error") || \
          error.message?.includes("CORS")) {\
        setFormError(\
          "CORS error detected. The backend server may not be running or is not properly configured. " +\
          "Click the button below to try to access the backend directly:"\
        );\
      }/g' frontend/src/components/auth/Login.js
      
      # Add button to verify backend connection
      sed -i '/{error || formError}/i \
        {formError && formError.includes("CORS error detected") && (\
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>\
            <Button\
              variant="outlined"\
              color="primary"\
              onClick={openBackendUrl}\
              size="small"\
            >\
              Test Backend Connection\
            </Button>\
          </Box>\
        )}' frontend/src/components/auth/Login.js
      
      print_success "Login component updated with better error handling"
    else
      print_success "Login component already has CORS error handling"
    fi
  else
    print_error "Login.js not found!"
  fi
}

# Start servers with fixed configuration
start_servers() {
  print_message "Starting servers with fixed CORS configuration..."
  
  # Check if any processes are already running on the required ports
  if check_port 3000; then
    print_warning "Frontend server is running on port 3000"
    read -p "Do you want to kill it? (y/n): " kill_frontend
    if [ "$kill_frontend" = "y" ]; then
      stop_process 3000
    fi
  fi
  
  if check_port 5000; then
    print_warning "Backend server is running on port 5000"
    read -p "Do you want to kill it? (y/n): " kill_backend
    if [ "$kill_backend" = "y" ]; then
      stop_process 5000
    fi
  fi
  
  # Create database directory if it doesn't exist
  if [ ! -d backend/database ]; then
    print_warning "Creating database directory..."
    mkdir -p backend/database
    print_success "Database directory created"
  fi
  
  # Start backend server - using subshell to preserve working directory
  print_warning "Starting backend server..."
  (cd backend && npm run dev) &
  backend_pid=$!
  print_success "Backend server started with PID: $backend_pid"
  
  # Wait for backend to start
  print_warning "Waiting for backend to start..."
  sleep 5
  
  # Start frontend server - using subshell to preserve working directory
  print_warning "Starting frontend server..."
  (cd frontend && npm start) &
  frontend_pid=$!
  print_success "Frontend server started with PID: $frontend_pid"
  
  print_success "Servers started with fixed CORS configuration."
  print_message "Press Ctrl+C to stop the servers."
  
  # Wait for Ctrl+C
  wait $backend_pid $frontend_pid
}

# Complete CORS repair
complete_cors_repair() {
  print_message "Starting complete CORS repair..."
  
  setup_cors_env
  fix_backend_cors
  fix_frontend_cors
  add_manifest_route
  update_auth_context
  fix_login_component
  
  print_success "CORS repairs complete. Ready to start servers."
  
  read -p "Do you want to start the servers now? (y/n): " start_now
  if [ "$start_now" = "y" ]; then
    start_servers
  fi
}

# Ultra quick CORS Fix specifically for GitHub Codespaces
github_codespaces_fix() {
  print_message "Running GitHub Codespaces specific fix..."
  
  # Update index.html with very permissive CSP
  if [ -f frontend/public/index.html ]; then
    print_warning "Adding permissive CSP for GitHub Codespaces..."
    
    # Remove any existing CSP meta tags
    sed -i '/<meta http-equiv="Content-Security-Policy"/d' frontend/public/index.html
    
    # Add extremely permissive CSP that will allow everything
    sed -i '/<meta\s\+name="description"/a \    <!-- CSP headers for GitHub Codespaces - permissive for development only -->\n    <meta http-equiv="Content-Security-Policy" content="default-src * '\''unsafe-inline'\'' '\''unsafe-eval'\''; script-src * '\''unsafe-inline'\'' '\''unsafe-eval'\''; connect-src * '\''unsafe-inline'\'' '\''unsafe-eval'\''; img-src * data: blob: '\''unsafe-inline'\''; frame-src *; style-src * '\''unsafe-inline'\'';">' frontend/public/index.html
    
    print_success "Permissive CSP added to index.html"
  fi
  
  # Update backend server.js for permissive CORS
  if [ -f backend/src/server.js ]; then
    print_warning "Adding permissive CORS to server.js..."
    
    # Add super permissive CORS
    cat > backend/src/temp-server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Very permissive CORS settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  credentials: true
}));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

EOF

    # Replace the top part of server.js with our custom code
    original_content=$(cat backend/src/server.js)
    import_line=$(echo "$original_content" | grep -n "const express = require('express')" | cut -d: -f1)
    app_line=$(echo "$original_content" | grep -n "// Middleware" | cut -d: -f1)
    
    if [ -n "$import_line" ] && [ -n "$app_line" ]; then
      # Get line number where middleware starts
      line_count=$(wc -l < backend/src/server.js)
      tail_start=$((app_line + 3))  # Skip middleware lines
      
      # Extract the tail part (after middleware)
      tail_content=$(tail -n +$tail_start backend/src/server.js)
      
      # Combine our header with the tail
      cat backend/src/temp-server.js > backend/src/server.js
      echo "$tail_content" >> backend/src/server.js
      
      rm backend/src/temp-server.js
      print_success "Permissive CORS added to server.js"
    else
      print_error "Could not locate correct lines in server.js"
    fi
  fi
  
  # Kill any running servers
  lsof -ti:3000,5000 | xargs kill -9 2>/dev/null
  print_success "Killed any running servers"
  
  print_success "GitHub Codespaces fix applied. Ready to start servers."
  read -p "Do you want to start the servers now? (y/n): " start_now
  if [ "$start_now" = "y" ]; then
    # Start servers
    (cd backend && npm run dev) &
    (cd frontend && npm start) &
    print_success "Servers started. Press Ctrl+C to stop."
    wait
  fi
}

# GitHub Codespaces specific fix
fix_github_codespaces() {
  echo "Applying GitHub Codespaces specific CORS fixes..."
  
  # Fix the frontend CORS and CSP issues
  (cd frontend && {
    # Update the index.html to remove any existing CSP meta tags and add a permissive one
    sed -i '/<meta http-equiv="Content-Security-Policy"/d' public/index.html
    sed -i '/<head>/a \  <meta http-equiv="Content-Security-Policy" content="default-src * self blob: data: gap:; style-src * self '\''unsafe-inline'\'' blob: data: gap:; script-src * '\''unsafe-eval'\'' '\''unsafe-inline'\'' blob: data: gap:; object-src * '\''unsafe-inline'\'' blob: data: gap:; img-src * self '\''unsafe-inline'\'' blob: data: gap:; connect-src self * '\''unsafe-inline'\'' blob: data: gap:; frame-src * self blob: data: gap:;">' public/index.html

    # Create or update the setupProxy.js file
    mkdir -p src
    cat > src/setupProxy.js << 'EOF'
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
      return `https://${codespaceName}-5000.app.github.dev`;
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
  };

  const backendUrl = getBackendUrl();
  console.log(`Proxying API requests to: ${backendUrl}`);

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
EOF

    # Add http-proxy-middleware to package.json if not present
    if ! grep -q "http-proxy-middleware" package.json; then
      sed -i '/devDependencies/a \    "http-proxy-middleware": "^2.0.6",' package.json
    fi

    echo "Frontend CORS fixes applied."
  })

  # Fix the backend CORS configuration
  (cd backend && {
    # Ensure CORS_ORIGIN=* in .env
    if [ -f .env ]; then
      if grep -q "CORS_ORIGIN" .env; then
        sed -i 's/CORS_ORIGIN=.*/CORS_ORIGIN=*/' .env
      else
        echo "CORS_ORIGIN=*" >> .env
      fi
    else
      echo "CORS_ORIGIN=*" > .env
    fi

    # Update server.js to include comprehensive CORS handling
    cat > src/cors-middleware.js << 'EOF'
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
EOF

    # Inject the cors-middleware.js into server.js if not already there
    if ! grep -q "setupCors" src/server.js; then
      sed -i '/app.use(cors/i const setupCors = require("./cors-middleware");' src/server.js
      sed -i '/app.use(cors/a setupCors(app);' src/server.js
    fi

    echo "Backend CORS fixes applied."
  })

  echo "GitHub Codespaces CORS fixes completed. You may need to restart your servers."
}

# Show menu
show_menu() {
  echo ""
  echo -e "${CYAN}SmartSprint CORS Issue Fixer${NC}"
  echo -e "${CYAN}==================================${NC}"
  echo ""
  echo "1. Check & kill running servers"
  echo "2. Setup CORS environment variables"
  echo "3. Fix backend CORS configuration"
  echo "4. Fix frontend CORS configuration"
  echo "5. Add special route for manifest.json"
  echo "6. Update AuthContext for Codespaces"
  echo "7. Fix Login component"
  echo "8. Start servers"
  echo "9. Run complete CORS fix (recommended)"
  echo "10. GitHub Codespaces specific fix (most permissive)"
  echo "0. Exit"
  echo ""
}

# Check for command line arguments to allow direct action
if [ "$1" = "--quick" ]; then
  github_codespaces_fix
  exit 0
elif [ "$1" = "--complete" ]; then
  complete_cors_repair
  exit 0
fi

# Main script
while true; do
  show_menu
  read -p "Enter your choice: " choice
  
  case $choice in
    1)
      if check_port 3000; then
        print_warning "Frontend server is running on port 3000"
        read -p "Do you want to kill it? (y/n): " kill_frontend
        if [ "$kill_frontend" = "y" ]; then
          stop_process 3000
        fi
      else
        print_success "No server running on port 3000"
      fi
      
      if check_port 5000; then
        print_warning "Backend server is running on port 5000"
        read -p "Do you want to kill it? (y/n): " kill_backend
        if [ "$kill_backend" = "y" ]; then
          stop_process 5000
        fi
      else
        print_success "No server running on port 5000"
      fi
      ;;
    2) setup_cors_env ;;
    3) fix_backend_cors ;;
    4) fix_frontend_cors ;;
    5) add_manifest_route ;;
    6) update_auth_context ;;
    7) fix_login_component ;;
    8) start_servers ;;
    9) complete_cors_repair ;;
    10) fix_github_codespaces ;;
    0) 
      print_message "Exiting CORS fixer..."
      exit 0
      ;;
    *) print_error "Invalid choice. Please try again." ;;
  esac
  
  echo ""
  read -p "Press Enter to continue..."
done 