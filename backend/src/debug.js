const { sequelize } = require('./config/db');
const { User } = require('./models');

// Debug function to check database connectivity
async function checkDatabaseConnection() {
  try {
    console.log('Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Debug function to check if tables exist and have data
async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Check if User table exists and has data
    const usersCount = await User.count();
    console.log(`✅ User table exists with ${usersCount} users`);
    
    // Check if admin user exists
    const adminUser = await User.findOne({
      where: { email: 'admin@smartsprint.com' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user exists');
    } else {
      console.log('❌ Admin user does not exist - creating default admin...');
      
      // Create default admin user
      await User.create({
        name: 'Admin User',
        email: 'admin@smartsprint.com',
        password: 'admin',
        role: 'Admin',
        team: 'None',
        level: 'None'
      });
      
      console.log('✅ Default admin user created');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking database tables:', error);
    return false;
  }
}

// Initialize database with sample data if empty
async function initializeDatabase() {
  try {
    console.log('Initializing database with sample data...');
    
    // Sync database structure
    await sequelize.sync({ alter: true });
    console.log('✅ Database structure synchronized');
    
    // Check for and create admin user
    await checkTables();
    
    console.log('✅ Database initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
}

// Export functions for use in other files
module.exports = {
  checkDatabaseConnection,
  checkTables,
  initializeDatabase
};

// If this file is run directly, execute the debug sequence
if (require.main === module) {
  (async () => {
    console.log('Running database diagnostics...');
    
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.log('❌ Cannot proceed with further checks - database connection failed');
      process.exit(1);
    }
    
    await initializeDatabase();
    
    console.log('Database diagnostics complete.');
  })();
} 