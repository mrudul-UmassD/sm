const { User } = require('../models');
const { Op } = require('sequelize');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create user (for admins and project managers)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, team, level } = req.body;
    
    // Check requester's role
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to create users' });
    }
    
    // Project Manager can only create users with lower privileges
    if (req.user.role === 'Project Manager' && (role === 'Admin' || role === 'Project Manager')) {
      return res.status(403).json({ message: 'Not authorized to create users with this role' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      team,
      level,
    });
    
    res.status(201).json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      level: user.level,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, team, level } = req.body;
    
    // Find user
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions
    // Only admin can update any user
    // Project Manager can only update users with lower privileges
    // Users can only update themselves
    if (req.user.role !== 'Admin' && 
        (req.user.role !== 'Project Manager' || (user.role === 'Admin' || user.role === 'Project Manager')) && 
        req.user.user_id !== user.user_id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      team: team || user.team,
      level: level || user.level,
    });
    
    res.status(200).json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      level: user.level,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions (only admin can delete users)
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete users' });
    }
    
    // Delete user
    await user.destroy();
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const users = await User.findAll({
      where: { role },
      attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users by team
const getUsersByTeam = async (req, res) => {
  try {
    const { team } = req.params;
    
    const users = await User.findAll({
      where: { team },
      attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
    });
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users by team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUsersByTeam,
}; 