const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./config/db');
const path = require('path');
const { initializeDatabase } = require('./debug');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

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

app.use((req, res, next) => {
  const allowedOrigins = [
    'https://upgraded-barnacle-r44jr96676472p459-3000.app.github.dev',
    'https://localhost:3000'
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special middleware to handle CORS preflight requests
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check database status
app.get('/debug/database', async (req, res) => {
  try {
    const dbStatus = await sequelize.authenticate();
    res.json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Debug endpoint to force database initialization
app.get('/debug/initialize', async (req, res) => {
  try {
    await initializeDatabase();
    res.json({
      status: 'ok',
      message: 'Database initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database initialization failed',
      error: error.message
    });
  }
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const performanceRoutes = require('./routes/performanceRoutes');

// Special route to handle manifest.json requests
app.get('/manifest.json', cors(corsOptions), (req, res) => {
  // Default manifest data
  const manifest = {
    short_name: "SmartSprint",
    name: "SmartSprint - AI-Enhanced Project Management",
    icons: [
      {
        src: "favicon.ico",
        sizes: "64x64 32x32 24x24 16x16",
        type: "image/x-icon"
      },
      {
        src: "logo192.png",
        type: "image/png",
        sizes: "192x192"
      },
      {
        src: "logo512.png",
        type: "image/png",
        sizes: "512x512"
      }
    ],
    start_url: ".",
    display: "standalone",
    theme_color: "#1976d2",
    background_color: "#ffffff"
  };
  
  res.json(manifest);
});

// Special route to serve logo files with proper CORS headers
app.get('/logo:size.png', cors(corsOptions), (req, res) => {
  res.sendFile(path.join(__dirname, '../public', `logo${req.params.size}.png`));
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/performance', performanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Check and initialize database before starting the server
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer(); 