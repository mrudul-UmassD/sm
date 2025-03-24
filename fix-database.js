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

// CORS and connectivity fixes
async function fixCorsConfiguration() {
  console.log('⚙️ Applying CORS configuration fixes...');

  // Fix backend CORS settings
  try {
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    let envContent = '';
    
    // Check if .env exists, otherwise create it
    if (fs.existsSync(backendEnvPath)) {
      envContent = fs.readFileSync(backendEnvPath, 'utf8');
      if (envContent.includes('CORS_ORIGIN=')) {
        envContent = envContent.replace(/CORS_ORIGIN=.*/, 'CORS_ORIGIN=*');
      } else {
        envContent += '\nCORS_ORIGIN=*';
      }
    } else {
      envContent = 'CORS_ORIGIN=*';
    }
    
    fs.writeFileSync(backendEnvPath, envContent);
    console.log('✅ Backend .env updated with CORS settings');

    // Create CORS middleware file
    const corsMiddlewarePath = path.join(__dirname, 'backend', 'src', 'cors-middleware.js');
    const corsMiddlewareContent = `
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
`;
    fs.writeFileSync(corsMiddlewarePath, corsMiddlewareContent);
    console.log('✅ Created CORS middleware file');
    
    // Update frontend setupProxy.js
    const setupProxyPath = path.join(__dirname, 'frontend', 'src', 'setupProxy.js');
    const setupProxyContent = `
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Determine the backend URL based on the environment
  const getBackendUrl = () => {
    const hostname = process.env.HOSTNAME || '';
    
    // Check if running in GitHub Codespaces
    if (hostname.includes('github.dev') || hostname.includes('app.github.dev')) {
      // Extract the codespace name from the hostname
      const codespaceNameMatch = hostname.match(/(.*?)-\\d+/);
      const codespaceName = codespaceNameMatch ? codespaceNameMatch[1] : '';
      
      // Construct the backend URL for GitHub Codespaces
      return \`https://\${codespaceName}-5000.app.github.dev\`;
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
  };

  const backendUrl = getBackendUrl();
  console.log(\`Proxying API requests to: \${backendUrl}\`);

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
`;
    
    // Ensure directory exists
    if (!fs.existsSync(path.join(__dirname, 'frontend', 'src'))) {
      fs.mkdirSync(path.join(__dirname, 'frontend', 'src'), { recursive: true });
    }
    
    fs.writeFileSync(setupProxyPath, setupProxyContent);
    console.log('✅ Created frontend proxy configuration');
    
    // Update frontend CSP in index.html
    const indexHtmlPath = path.join(__dirname, 'frontend', 'public', 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      // Remove any existing CSP tags
      indexHtml = indexHtml.replace(/<meta http-equiv="Content-Security-Policy".*?>/g, '');
      
      // Add permissive CSP tag
      const cspTag = '<meta http-equiv="Content-Security-Policy" content="default-src * self blob: data: gap:; style-src * self \'unsafe-inline\' blob: data: gap:; script-src * \'unsafe-eval\' \'unsafe-inline\' blob: data: gap:; object-src * \'unsafe-inline\' blob: data: gap:; img-src * self \'unsafe-inline\' blob: data: gap:; connect-src self * \'unsafe-inline\' blob: data: gap:; frame-src * self blob: data: gap:;">';
      
      // Add CSP after the charset meta tag
      indexHtml = indexHtml.replace(/<meta charset=".*?">/i, '$&\n    ' + cspTag);
      
      fs.writeFileSync(indexHtmlPath, indexHtml);
      console.log('✅ Updated frontend CSP in index.html');
    }
    
    // Add http-proxy-middleware to frontend dependencies
    const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      
      // Add http-proxy-middleware to devDependencies if it doesn't exist
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }
      
      if (!packageJson.devDependencies['http-proxy-middleware']) {
        packageJson.devDependencies['http-proxy-middleware'] = '^2.0.6';
      }
      
      fs.writeFileSync(frontendPackagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added http-proxy-middleware to frontend package.json');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error applying CORS fixes:', error);
    return false;
  }
}

// Create necessary directories
async function createDirectories() {
  console.log('Creating necessary directories...');
  
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
  
  return true;
}

// Initialize the database
async function initializeDatabase() {
  console.log('\n2. Initializing database...');
  
  try {
    console.log('Running database initialization script...');
    runCommand('cd backend && node src/debug.js', 'Failed to initialize database');
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed, but continuing with fixes...', error);
    return false;
  }
}

// Create static files (logo files)
async function createStaticFiles() {
  console.log('\n3. Creating static files...');
  
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
  
  // Also create favicon.ico if it doesn't exist
  const faviconPath = './backend/public/favicon.ico';
  if (!fs.existsSync(faviconPath)) {
    console.log('Creating placeholder favicon.ico...');
    // Simple 16x16 ICO file
    const minimalIco = Buffer.from([
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
      0x20, 0x00, 0x68, 0x04, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
      0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00,
      0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00
    ]);
    fs.writeFileSync(faviconPath, minimalIco);
  }
  
  console.log('✅ Static files created successfully');
  return true;
}

// Update environment file
async function updateEnvFile() {
  console.log('\n4. Updating environment configuration...');
  
  const envPath = './backend/.env';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Add or update essential environment variables
  const envVars = {
    PORT: 5000,
    NODE_ENV: 'development',
    JWT_SECRET: 'development-secret-key',
    CORS_ORIGIN: '*'
  };
  
  // Update each environment variable
  Object.entries(envVars).forEach(([key, value]) => {
    const regex = new RegExp(`${key}=.*`, 'g');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });
  
  // Write the updated .env file
  fs.writeFileSync(envPath, envContent.trim());
  
  console.log('✅ Environment configuration updated');
  return true;
}

// Main function
async function main() {
  console.log('\n📊 SmartSprint Database Troubleshooter\n');
  
  // Check if we're running in the root directory
  if (!fs.existsSync('./backend') || !fs.existsSync('./frontend')) {
    console.error('❌ This script must be run from the project root directory (where frontend and backend folders are located).');
    return;
  }
  
  // Fix potential CORS issues
  await fixCorsConfiguration();
  
  console.log('\n1. Checking environment...');
  
  // Create backend directory if it doesn't exist
  await createDirectories();
  
  // Initialize the database
  await initializeDatabase();
  
  // Create static files (logo files)
  await createStaticFiles();
  
  // Create or update .env file
  await updateEnvFile();
  
  // Print next steps
  console.log('\n🚀 Setup complete! Next steps:');
  console.log('1. Start backend: cd backend && npm start');
  console.log('2. In a new terminal, start frontend: cd frontend && npm start');
  console.log('3. Visit http://localhost:3000 to use the application');
  console.log('\n📝 If you encounter any issues, refer to the README.md troubleshooting section');
}

// Run main function
main().catch(error => {
  console.error('Script failed with error:', error);
  process.exit(1); 
}); 