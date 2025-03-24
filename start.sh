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

# Make sure script exits on error
set -e

print_message "Setting up SmartSprint project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  handle_error "Node.js is not installed. Please install Node.js (v14+) and try again."
fi

# Create .env file for backend if it doesn't exist
if [ ! -f backend/.env ]; then
  print_message "Creating backend .env file..."
  cp backend/.env.example backend/.env 2>/dev/null || echo -e "PORT=5000\nJWT_SECRET=smartsprint_secret_key\nNODE_ENV=development" > backend/.env
fi

# Create database directory if it doesn't exist
if [ ! -d backend/database ]; then
  print_message "Creating database directory..."
  mkdir -p backend/database
fi

# Install backend dependencies
print_message "Installing backend dependencies..."
cd backend
npm install || handle_error "Failed to install backend dependencies"

# Initialize database
print_message "Initializing database with sample data..."
npm run init-db || handle_error "Failed to initialize database"
cd ..

# Install frontend dependencies
print_message "Installing frontend dependencies..."
cd frontend
npm install || handle_error "Failed to install frontend dependencies"
cd ..

# Install concurrently if not already installed
if ! npm list -g concurrently &> /dev/null; then
  print_message "Installing concurrently package..."
  npm install -g concurrently || npm install concurrently
fi

print_message "Setup complete! Starting the application..."

# Start both servers
concurrently "cd backend && npm run dev" "cd frontend && npm start" || handle_error "Failed to start servers" 