# SmartSprint - AI-Enhanced Project Management System

SmartSprint is a comprehensive project management system enhanced by AI for automating task assignments, tracking developer performance, and providing in-depth analytics.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: CRUD operations with hierarchical roles (Admin, Project Manager, Developer, Tester)
- **Project Management**: Create and track projects through their lifecycle
- **Task Management**: Create, assign, and track tasks with detailed status updates
- **Performance Tracking**: Log and analyze time spent on tasks with analytics
- **AI Integration**: Placeholders for AI-based task assignment optimization

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
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── layout/         # Layout components
│   │   │   └── routing/        # Routing components
│   │   ├── context/            # React context
│   │   ├── pages/              # Page components
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

## Default Credentials

The system is initialized with a default admin user:
- Email: admin@smartsprint.com
- Password: admin

## API Documentation

### Authentication Endpoints
- POST `/api/auth/login`: Login with email and password
- POST `/api/auth/register`: Register a new user
- GET `/api/auth/profile`: Get current user profile
- POST `/api/auth/change-password`: Change user password

### User Endpoints
- GET `/api/users`: Get all users
- GET `/api/users/:id`: Get user by ID
- POST `/api/users`: Create a new user (Admin, Project Manager)
- PUT `/api/users/:id`: Update a user
- DELETE `/api/users/:id`: Delete a user (Admin only)
- GET `/api/users/role/:role`: Get users by role
- GET `/api/users/team/:team`: Get users by team

### Project Endpoints
- GET `/api/projects`: Get all projects
- GET `/api/projects/:id`: Get project by ID
- POST `/api/projects`: Create a new project (Admin, Project Manager)
- PUT `/api/projects/:id`: Update a project (Admin, Project Manager)
- DELETE `/api/projects/:id`: Delete a project (Admin only)
- GET `/api/projects/status/:status`: Get projects by status

For more API endpoints, refer to the route files in the backend code.

## Troubleshooting

If you encounter issues with running the application:

1. **Port conflicts**: Make sure ports 3000 and 5000 are not being used by other applications
2. **Database issues**: Check that the SQLite database file was created correctly in `backend/database/`
3. **Node version**: This application works best with Node.js 14+
4. **Docker issues**: If using Docker, ensure Docker Desktop is running and ports 3000 and 5000 are free

## License

This project is licensed under the MIT License. 