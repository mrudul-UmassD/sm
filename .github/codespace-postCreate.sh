#!/bin/bash

# Display welcome message
echo "Setting up SmartSprint development environment..."

# Create necessary directories if they don't exist
mkdir -p backend/database

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
  echo "Creating backend .env file..."
  cat > backend/.env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=smartsprint_dev_secret
JWT_EXPIRY=7d
DATABASE_PATH=./database/smartsprint.db
EOF
  echo "Backend .env file created."
fi

# Install dependencies
echo "Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..
npm install

# Initialize the database with sample data
echo "Initializing database with sample data..."
cd backend && npm run init-db
cd ..

echo "SmartSprint environment setup complete!"
echo "Run 'npm start' to start the application or use 'bash ./start.sh'" 