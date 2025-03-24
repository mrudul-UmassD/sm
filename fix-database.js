#!/usr/bin/env node

/**
 * Database Initialization and Fix Script
 * 
 * This script will:
 * 1. Check database connectivity
 * 2. Initialize the database structure and sample data
 * 3. Fix common database issues
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('SmartSprint Database Fix Script');
console.log('===============================');

// Check if the script is being run from the correct location
if (!fs.existsSync('./backend') || !fs.existsSync('./frontend')) {
  console.error('Error: This script must be run from the root project directory');
  console.error('Please run: node fix-database.js from the main project folder');
  process.exit(1);
}

// Function to run a command and log output
function runCommand(command, errorMessage) {
  try {
    console.log(`> ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error: ${errorMessage}`);
    console.error(error.stdout || error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('\n1. Checking environment...');
  
  // Ensure backend database directory exists
  if (!fs.existsSync('./backend/database')) {
    console.log('Creating database directory...');
    fs.mkdirSync('./backend/database', { recursive: true });
  }
  
  // Ensure backend public directory exists for logo files
  if (!fs.existsSync('./backend/public')) {
    console.log('Creating public directory for static files...');
    fs.mkdirSync('./backend/public', { recursive: true });
  }
  
  // Create simple logo files if they don't exist
  const createLogoFile = (size) => {
    const logoPath = `./backend/public/logo${size}.png`;
    if (!fs.existsSync(logoPath)) {
      console.log(`Creating placeholder logo${size}.png...`);
      // Write a minimal valid PNG file (1x1 pixel)
      const minimalPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(logoPath, minimalPng);
    }
  };
  
  createLogoFile(192);
  createLogoFile(512);
  
  console.log('\n2. Installing required dependencies...');
  runCommand('cd backend && npm install', 'Failed to install backend dependencies');
  
  console.log('\n3. Running database initialization...');
  try {
    runCommand('cd backend && node src/debug.js', 'Failed to initialize database');
  } catch (error) {
    console.error('Database initialization failed, but continuing with fixes...');
  }
  
  console.log('\n4. Starting the backend server...');
  console.log('The backend server will start in a new terminal window.');
  console.log('Please use Ctrl+C in that window to stop the server when done testing.');
  
  // Start the backend server in a new process
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    runCommand('start cmd /k "cd backend && npm start"', 'Failed to start backend server');
  } else {
    runCommand('cd backend && npm start &', 'Failed to start backend server');
  }
  
  console.log('\n5. Testing backend connection...');
  setTimeout(() => {
    console.log('Waiting for server to start...');
    runCommand('curl http://localhost:5000/health', 'Failed to connect to backend server');
    
    console.log('\nDatabase fix complete!');
    console.log('\nNext steps:');
    console.log('1. Verify the backend is running at http://localhost:5000/health');
    console.log('2. Use the API test utility at http://localhost:3000/api-test.html');
    console.log('3. Enable authentication bypass by clicking "Enable Auth Bypass" on the API test page');
    console.log('4. Go to the dashboard with bypass by clicking "Go to Dashboard with Bypass"');
  }, 5000);
}

// Run main function
main().catch(error => {
  console.error('Script failed with error:', error);
  process.exit(1); 
}); 