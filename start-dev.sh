#!/bin/bash

# Print colorful messages
print_message() {
  echo -e "\e[1;34m>> $1\e[0m"
}

# Error handling
handle_error() {
  echo -e "\e[1;31mError: $1\e[0m"
  exit 1
}

# Check if application servers are running
check_running_servers() {
  print_message "Checking for running servers..."
  
  # Check if port 3000 is in use (frontend)
  if netstat -ano | grep -q ":3000"; then
    print_message "Frontend server is already running on port 3000."
    read -p "Do you want to kill it? (y/n): " kill_frontend
    if [ "$kill_frontend" = "y" ]; then
      print_message "Killing frontend server..."
      if [ "$(uname)" = "Darwin" ]; then
        # macOS
        lsof -ti:3000 | xargs kill -9
      else
        # Linux/Windows (WSL)
        fuser -k 3000/tcp
      fi
    fi
  fi
  
  # Check if port 5000 is in use (backend)
  if netstat -ano | grep -q ":5000"; then
    print_message "Backend server is already running on port 5000."
    read -p "Do you want to kill it? (y/n): " kill_backend
    if [ "$kill_backend" = "y" ]; then
      print_message "Killing backend server..."
      if [ "$(uname)" = "Darwin" ]; then
        # macOS
        lsof -ti:5000 | xargs kill -9
      else
        # Linux/Windows (WSL)
        fuser -k 5000/tcp
      fi
    fi
  fi
}

# Debug environment
debug_environment() {
  print_message "Debugging environment..."
  
  # Check Node.js and npm versions
  print_message "Node.js version: $(node -v)"
  print_message "npm version: $(npm -v)"
  
  # Check backend dependencies
  if [ -f backend/package.json ]; then
    print_message "Backend dependencies:"
    cat backend/package.json | grep -A 15 "dependencies"
  else
    handle_error "Backend package.json not found"
  fi
  
  # Check frontend dependencies
  if [ -f frontend/package.json ]; then
    print_message "Frontend dependencies:"
    cat frontend/package.json | grep -A 15 "dependencies"
  else
    handle_error "Frontend package.json not found"
  fi
  
  # Check if .env file exists
  if [ -f backend/.env ]; then
    print_message "Backend .env file exists"
  else
    print_message "Creating backend .env file..."
    cat > backend/.env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=smartsprint_dev_secret
JWT_EXPIRY=7d
DATABASE_PATH=./database/smartsprint.db
EOF
  fi
}

# Setup database
setup_database() {
  print_message "Setting up database..."
  mkdir -p backend/database
  
  # Check if database file exists
  if [ -f backend/database/smartsprint.db ]; then
    print_message "Database file exists."
    read -p "Do you want to reset the database? (y/n): " reset_db
    if [ "$reset_db" = "y" ]; then
      print_message "Removing existing database..."
      rm backend/database/smartsprint.db
      print_message "Initializing new database..."
      cd backend && npm run init-db && cd ..
    fi
  else
    print_message "Initializing new database..."
    cd backend && npm run init-db && cd ..
  fi
}

# Repair NPM issues
repair_npm_issues() {
  print_message "Repairing NPM issues..."
  
  # Clear npm cache
  print_message "Clearing npm cache..."
  npm cache clean --force
  
  # Reinstall backend dependencies
  print_message "Reinstalling backend dependencies..."
  cd backend
  rm -rf node_modules
  rm -f package-lock.json
  npm install
  cd ..
  
  # Reinstall frontend dependencies
  print_message "Reinstalling frontend dependencies..."
  cd frontend
  rm -rf node_modules
  rm -f package-lock.json
  npm install
  cd ..
}

# Start servers in separate terminals
start_servers() {
  print_message "Starting servers..."
  
  # Start backend server
  cd backend && npm run dev & 
  BACKEND_PID=$!
  print_message "Backend server started with PID: $BACKEND_PID"
  
  # Wait for backend to start
  sleep 5
  
  # Start frontend server
  cd frontend && npm start &
  FRONTEND_PID=$!
  print_message "Frontend server started with PID: $FRONTEND_PID"
  
  print_message "Servers started. Press Ctrl+C to stop both servers."
  
  # Wait for Ctrl+C and kill both servers
  trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
  wait
}

# Main script execution
print_message "SmartSprint Development Troubleshooter"
print_message "=================================="

# Menu
PS3="Select an option: "
options=("Check & kill running servers" "Debug environment" "Setup/reset database" "Repair NPM issues" "Start servers" "Exit")
select opt in "${options[@]}"
do
  case $opt in
    "Check & kill running servers")
      check_running_servers
      ;;
    "Debug environment")
      debug_environment
      ;;
    "Setup/reset database")
      setup_database
      ;;
    "Repair NPM issues")
      repair_npm_issues
      ;;
    "Start servers")
      start_servers
      ;;
    "Exit")
      print_message "Exiting troubleshooter..."
      break
      ;;
    *) 
      echo "Invalid option $REPLY"
      ;;
  esac
done 