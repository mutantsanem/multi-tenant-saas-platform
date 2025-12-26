const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Membership = require('../models/Membership');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

const requireOrg = async (req, res, next) => {
  try {
    const orgId = req.header('X-Organization-ID') || req.params.orgId || req.body.organizationId;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required.'
      });
    }

    // Check if user is member of the organization
    const membership = await Membership.findOne({
      userId: req.user._id,
      organizationId: orgId,
      isActive: true
    }).populate('organizationId');

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this organization.'
      });
    }

    req.organization = membership.organizationId;
    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating organization access.'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({
        success: false,
        message: 'Organization context required.'
      });
    }

    if (!roles.includes(req.membership.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({
        success: false,
        message: 'Organization context required.'
      });
    }

    if (!Membership.hasPermission(req.membership.role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  auth,
  requireOrg,
  requireRole,
  requirePermission
};