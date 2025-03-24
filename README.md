# SmartSprint - AI-Enhanced Project Management System

SmartSprint is a comprehensive project management system enhanced by AI for automating task assignments, tracking developer performance, and providing in-depth analytics.

## Features

- **Simplified Authentication**: Email-based authentication with role-based access control
- **User Management**: CRUD operations with hierarchical roles (Admin, Project Manager, Developer, Tester)
- **Project Management**: Create and track projects through their lifecycle
- **Task Management**: Create, assign, and track tasks with detailed status updates
- **Performance Tracking**: Log and analyze time spent on tasks with analytics
- **API Utilities**: Built-in tools for testing API connectivity and diagnosing issues

## Tech Stack

### Backend
- Node.js with Express.js
- SQLite database with Sequelize ORM
- JWT for authentication

### Frontend
- React.js with Material-UI
- React Router for navigation
- Chart.js for analytics visualization

## Quick Start (GitHub Codespace)

GitHub Codespaces automatically sets up your environment. Just click "Code > Open with Codespaces" in the GitHub repository.

### One-Command Setup and Run
To set up and run the entire application with a single command:

```bash
# Install dependencies and run the application
bash ./start.sh
```

This script will:
1. Install all dependencies for both backend and frontend
2. Set up the SQLite database (created automatically)
3. Start both the backend and frontend servers concurrently

The backend will run on http://localhost:5000 and the frontend on http://localhost:3000.

### Using NPM Scripts (Alternative)

You can also use the npm scripts defined in the root package.json:

```bash
# Install all dependencies
npm install

# Start both backend and frontend
npm start
```

### Docker Setup (Alternative)

If you prefer using Docker:

```bash
# Build and start the containers
docker-compose up

# To rebuild containers after changes
docker-compose up --build
```

The backend will run on http://localhost:5000 and the frontend on http://localhost:3000.

## Project Structure

```
smartsprint/
├── .github/                    # GitHub-specific files
│   ├── workflows/              # GitHub Actions workflow definitions
│   └── codespace-postCreate.sh # Setup script for GitHub Codespaces
│
├── backend/                    # Backend Express application
│   ├── database/               # SQLite database files
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Express middleware
│   │   ├── models/             # Sequelize models
│   │   ├── routes/             # API routes
│   │   ├── scripts/            # Utility scripts
│   │   └── server.js           # Main server file
│   ├── .env.example            # Environment variables example
│   ├── package.json            # Backend dependencies
│   └── Dockerfile              # Docker configuration for backend
│
├── frontend/                   # React frontend application
│   ├── public/                 # Static files
│   │   ├── api-test.html       # API test utility
│   │   └── bypass.html         # Authentication bypass utility
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── layout/         # Layout components
│   │   │   ├── routing/        # Routing components
│   │   │   └── users/          # User management components
│   │   ├── context/            # React context
│   │   ├── services/           # API services
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Main App component
│   │   └── index.js            # Entry point
│   ├── package.json            # Frontend dependencies
│   └── Dockerfile              # Docker configuration for frontend
│
├── .devcontainer/              # Dev container configuration for Codespaces
├── docker-compose.yml          # Docker Compose configuration
├── package.json                # Root package.json for running both services
├── start.sh                    # Bash script to set up and start the application
└── README.md                   # Project documentation
```

## Authentication & Access

### Default Credentials

The system is initialized with a default admin user:
- Email: admin@smartsprint.com
- Password: admin

### Simplified Authentication

The system uses email-only authentication:
- All other authentication methods have been disabled
- User registration is restricted to admin users via the User Management page

### User Roles

1. **Admin**: Full access to all features, can manage users, projects, and analytics
2. **Project Manager**: Can create and manage projects and tasks
3. **Developer**: Can work on assigned tasks
4. **Tester**: Can test and review tasks

## Authentication Bypass

For development and testing purposes, you can bypass the authentication system completely using one of these methods:

1. **Via Login Page**: On the login page, check the "Bypass Authentication" checkbox to skip login
   
2. **Via Direct URL**: Access `/bypass` in your browser to go directly to the dashboard with admin access

3. **Via API Calls**: Add `?bypass=true` to any API request to automatically bypass authentication
   Example: `http://localhost:5000/api/projects?bypass=true`

4. **Via Console**: Run this in your browser's console to enable bypass:
   ```javascript
   localStorage.setItem('authBypass', 'true');
   window.location.href = '/dashboard';
   ```

5. **Via the API Service**: In your code, use the `api` service to enable/disable bypass:
   ```javascript
   import api from './services/api';
   api.enableAuthBypass();
   // or
   api.disableAuthBypass();
   ```

> **Security Warning**: The authentication bypass is intended for development and testing only. Make sure to disable it in production environments.

## User Management

The User Management page (accessible to admins) allows you to:

1. **View all users**: See a list of all users with their roles, teams, and levels
2. **Add new users**: Create users with different roles (Admin, Project Manager, Developer, Tester)
3. **Edit existing users**: Update user details, change roles, teams, or levels
4. **Delete users**: Remove users from the system (except the default admin)

## API Test Utility

For diagnosing API connection issues, use the API Test Utility:

1. Navigate to `/api-test.html` in your browser
2. Use the auto-detect feature to find your backend API URL
3. Test the connection to the backend
4. Try accessing different endpoints (Tasks, Projects, Users)
5. Fix common issues like duplicate API paths

## API Documentation

### Authentication Endpoints
- POST `/api/auth/login`: Login with email and password

### User Endpoints
- GET `/api/users`: Get all users
- GET `/api/users/:id`: Get user by ID
- POST `/api/users`: Create a new user (Admin only)
- PUT `/api/users/:id`: Update a user (Admin only)
- DELETE `/api/users/:id`: Delete a user (Admin only)

### Project Endpoints
- GET `/api/projects`: Get all projects
- GET `/api/projects/:id`: Get project by ID
- POST `/api/projects`: Create a new project (Admin, Project Manager)
- PUT `/api/projects/:id`: Update a project (Admin, Project Manager)
- DELETE `/api/projects/:id`: Delete a project (Admin only)

### Task Endpoints
- GET `/api/tasks`: Get all tasks
- GET `/api/tasks/:id`: Get task by ID
- GET `/api/tasks/user/:id`: Get tasks assigned to a user
- POST `/api/tasks`: Create a new task
- PUT `/api/tasks/:id`: Update a task

For more API endpoints, refer to the route files in the backend code.

## Troubleshooting

If you encounter issues with the application:

1. **Database Connection Issues**: Use the database troubleshooting script to fix common issues:
   ```bash
   # Run the database fix script from the project root
   node fix-database.js
   ```
   This script will:
   - Create necessary directories
   - Initialize the database
   - Create missing static files
   - Start the backend server for testing

2. **API Connection Issues**: Use the `/api-test.html` utility to diagnose API connectivity problems:
   - Navigate to http://localhost:3000/api-test.html
   - Test endpoints with the authentication bypass enabled
   - Check server responses and error messages

3. **Server 500 Errors**: These usually indicate database issues. Try these solutions:
   - Run the `/debug/initialize` endpoint (http://localhost:5000/debug/initialize?bypass=true)
   - Check if the SQLite database file exists in `backend/database/`
   - Verify all required tables were created
   - Use the "Initialize Database" button shown in the dashboard error message

4. **Authentication Problems**: Use the authentication bypass to access the system without login:
   - Enable bypass through the login page checkbox
   - Or visit `/bypass` to directly access the dashboard with bypass enabled
   - Or use the API test utility to enable bypass programmatically

5. **Data Loading Issues**: Check for duplicate `/api/api/` paths in API calls:
   - Use the "Fix Duplicate API Path" button in the API test utility
   - Verify API URLs in the browser console

6. **Port conflicts**: Make sure ports 3000 and 5000 are not being used by other applications

7. **CORS Errors**: May indicate the backend is not running or has configuration issues:
   - Verify the backend server is running
   - Check that CORS is properly configured in `backend/src/server.js`

8. **Advanced Debugging**: For developers, the system provides additional debugging endpoints:
   - `/debug/database` - Check database connection status
   - `/debug/initialize` - Force database initialization with sample data
   - Use `node backend/src/debug.js` to run diagnostic tests directly

## License

This project is licensed under the MIT License. 