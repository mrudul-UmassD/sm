const { verifyToken } = require('../config/jwt');
const { User } = require('../models');

// Middleware to check if user is authenticated
const authenticate = async (req, res, next) => {
  try {
    // AUTH BYPASS: Check for bypass query parameter
    if (req.query.bypass === 'true') {
      console.log('AUTH BYPASS: Authentication bypassed!');
      // Set default admin user
      const adminUser = await User.findOne({ where: { email: 'admin@smartsprint.com' } });
      if (adminUser) {
        req.user = adminUser;
        return next();
      }
    }
    
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    // AUTH BYPASS: Check for bypass query parameter
    if (req.query.bypass === 'true') {
      console.log('AUTH BYPASS: Authorization bypassed!');
      return next();
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
}; 