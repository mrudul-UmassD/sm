#!/usr/bin/env node

// This script initializes the database with default data
const { syncDatabase } = require('../models');
const { User, Project, Task } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Sync database - this will create tables and default admin user
    await syncDatabase();
    
    // Check if we need to create sample data
    const projectCount = await Project.count();
    
    if (projectCount === 0) {
      console.log('Creating sample data...');
      
      // Create a sample project
      const project = await Project.create({
        name: 'Sample Project',
        description: 'This is a sample project created during initialization',
        status: 'Active'
      });
      
      // Create some sample tasks
      await Task.create({
        project_id: project.project_id,
        title: 'Setup Development Environment',
        description: 'Install and configure necessary tools and dependencies',
        status: 'Completed'
      });
      
      await Task.create({
        project_id: project.project_id,
        title: 'Design Database Schema',
        description: 'Create database models and relationships',
        status: 'In Progress'
      });
      
      await Task.create({
        project_id: project.project_id,
        title: 'Implement User Authentication',
        description: 'Create login and registration functionality',
        status: 'Created'
      });
      
      console.log('Sample data created successfully!');
    } else {
      console.log('Database already contains data. Skipping sample data creation.');
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Initialization error:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase; 