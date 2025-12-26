const express = require('express');
const User = require('../models/User');
const Membership = require('../models/Membership');
const { auth, requireOrg, requirePermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const auditLog = require('../middleware/auditLog');

const router = express.Router();

/**
 * @swagger
 * /api/users/{userId}/role:
 *   put:
 *     summary: Update user role in organization
 *     tags: [Users]
 */
router.put('/:userId/role', 
  auth, 
  requireOrg, 
  requirePermission('manage_users'),
  validate(schemas.updateUserRole),
  auditLog('update_role', 'user'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Check if user exists in organization
      const membership = await Membership.findOne({
        userId,
        organizationId: req.organization._id,
        isActive: true
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User not found in organization'
        });
      }

      // Prevent changing owner role
      if (membership.role === 'owner') {
        return res.status(400).json({
          success: false,
          message: 'Cannot change owner role'
        });
      }

      // Prevent non-owners from creating admins
      if (role === 'admin' && req.membership.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Only owners can assign admin role'
        });
      }

      membership.role = role;
      await membership.save();

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          userId,
          role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user role'
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}/status:
 *   put:
 *     summary: Activate/deactivate user in organization
 *     tags: [Users]
 */
router.put('/:userId/status', 
  auth, 
  requireOrg, 
  requirePermission('manage_users'),
  auditLog('update_status', 'user'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      // Check if user exists in organization
      const membership = await Membership.findOne({
        userId,
        organizationId: req.organization._id
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User not found in organization'
        });
      }

      // Prevent deactivating owner
      if (membership.role === 'owner' && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate organization owner'
        });
      }

      membership.isActive = isActive;
      await membership.save();

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          userId,
          isActive
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user status'
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Remove user from organization
 *     tags: [Users]
 */
router.delete('/:userId', 
  auth, 
  requireOrg, 
  requirePermission('manage_users'),
  auditLog('remove', 'user'),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user exists in organization
      const membership = await Membership.findOne({
        userId,
        organizationId: req.organization._id
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'User not found in organization'
        });
      }

      // Prevent removing owner
      if (membership.role === 'owner') {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove organization owner'
        });
      }

      await Membership.findByIdAndDelete(membership._id);

      res.json({
        success: true,
        message: 'User removed from organization successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing user from organization'
      });
    }
  }
);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 */
router.get('/:userId', auth, requireOrg, async (req, res) => {
  try {
    const { userId } = req.params;

    const membership = await Membership.findOne({
      userId,
      organizationId: req.organization._id
    }).populate({
      path: 'userId',
      select: 'firstName lastName email lastLoginAt isActive createdAt'
    }).populate({
      path: 'invitedBy',
      select: 'firstName lastName email'
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'User not found in organization'
      });
    }

    res.json({
      success: true,
      data: {
        id: membership.userId._id,
        email: membership.userId.email,
        firstName: membership.userId.firstName,
        lastName: membership.userId.lastName,
        role: membership.role,
        isActive: membership.isActive,
        joinedAt: membership.joinedAt,
        lastLoginAt: membership.userId.lastLoginAt,
        invitedBy: membership.invitedBy ? {
          firstName: membership.invitedBy.firstName,
          lastName: membership.invitedBy.lastName
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

module.exports = router;