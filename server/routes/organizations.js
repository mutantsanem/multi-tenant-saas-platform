const express = require('express');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const { auth, requireOrg, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const auditLog = require('../middleware/auditLog');

const router = express.Router();

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get user's organizations
 *     tags: [Organizations]
 */
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await Membership.find({
      userId: req.user._id,
      isActive: true
    }).populate('organizationId');

    const organizations = memberships.map(m => ({
      id: m.organizationId._id,
      name: m.organizationId.name,
      domain: m.organizationId.domain,
      role: m.role,
      joinedAt: m.joinedAt,
      isActive: m.organizationId.isActive
    }));

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organizations'
    });
  }
});

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization details
 *     tags: [Organizations]
 */
router.get('/:orgId', auth, requireOrg, async (req, res) => {
  try {
    const memberCount = await Membership.countDocuments({
      organizationId: req.organization._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        id: req.organization._id,
        name: req.organization.name,
        domain: req.organization.domain,
        timezone: req.organization.timezone,
        settings: req.organization.settings,
        memberCount,
        userRole: req.membership.role,
        createdAt: req.organization.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organization details'
    });
  }
});

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
 */
router.put('/:orgId', 
  auth, 
  requireOrg, 
  requireRole(['owner', 'admin']),
  auditLog('update', 'organization'),
  async (req, res) => {
    try {
      const { name, domain, timezone, settings } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (domain !== undefined) updateData.domain = domain;
      if (timezone) updateData.timezone = timezone;
      if (settings) updateData.settings = { ...req.organization.settings, ...settings };

      const organization = await Organization.findByIdAndUpdate(
        req.organization._id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: organization
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Domain already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error updating organization'
      });
    }
  }
);

/**
 * @swagger
 * /api/organizations/{id}/members:
 *   get:
 *     summary: Get organization members
 *     tags: [Organizations]
 */
router.get('/:orgId/members', auth, requireOrg, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { organizationId: req.organization._id, isActive: true };
    if (role) query.role = role;

    let memberships = await Membership.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName email lastLoginAt isActive'
      })
      .populate({
        path: 'invitedBy',
        select: 'firstName lastName email'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by search if provided
    if (search) {
      memberships = memberships.filter(m => 
        m.userId.firstName.toLowerCase().includes(search.toLowerCase()) ||
        m.userId.lastName.toLowerCase().includes(search.toLowerCase()) ||
        m.userId.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Membership.countDocuments(query);

    const members = memberships.map(m => ({
      id: m.userId._id,
      email: m.userId.email,
      firstName: m.userId.firstName,
      lastName: m.userId.lastName,
      role: m.role,
      isActive: m.userId.isActive,
      joinedAt: m.joinedAt,
      lastLoginAt: m.userId.lastLoginAt,
      invitedBy: m.invitedBy ? {
        firstName: m.invitedBy.firstName,
        lastName: m.invitedBy.lastName
      } : null
    }));

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching members'
    });
  }
});

module.exports = router;