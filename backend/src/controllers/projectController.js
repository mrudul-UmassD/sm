const { Project, Task } = require('../models');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id, {
      include: [
        {
          model: Task,
          attributes: ['task_id', 'title', 'status', 'assigned_to'],
        },
      ],
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create project
const createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    // Check permissions (only admin and project manager can create projects)
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to create projects' });
    }
    
    // Create project
    const project = await Project.create({
      name,
      description,
      status: status || 'Not Started',
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    // Find project
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permissions (only admin and project manager can update projects)
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to update projects' });
    }
    
    // Update project
    await project.update({
      name: name || project.name,
      description: description !== undefined ? description : project.description,
      status: status || project.status,
    });
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find project
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permissions (only admin can delete projects)
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete projects' });
    }
    
    // Delete project (this will also delete associated tasks due to cascade)
    await project.destroy();
    
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get projects by status
const getProjectsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const projects = await Project.findAll({
      where: { status },
    });
    
    res.status(200).json(projects);
  } catch (error) {
    console.error('Get projects by status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
}; 