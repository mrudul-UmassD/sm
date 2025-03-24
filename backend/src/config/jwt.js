const jwt = require('jsonwebtoken');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'smartsprint_secret_key';
const JWT_EXPIRES_IN = '24h';

// Function to generate JWT token
const generateToken = (user) => {
  const payload = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team,
    level: user.level,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  verifyToken,
}; 