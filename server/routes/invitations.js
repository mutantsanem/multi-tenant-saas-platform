const express = require('express');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Membership = require('../models/Membership');
const { auth, requireOrg, requirePermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { sendInvitationEmail } = require('../utils/email');
const { generateTokens } = require('../utils/jwt');
const auditLog = require('../middleware/auditLog');

const router = express.Router();

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Invite user to organization
 *     tags: [Invitations]
 */
router.post('/', 
  auth, 
  requireOrg, 
  requirePermission('invite_users'),
  validate(schemas.inviteUser),
  auditLog('invite', 'user'),
  async (req, res) => {
    try {
      const { email, role = 'member' } = req.body;

      // Check if user already exists in organization
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const existingMembership = await Membership.findOne({
          userId: existingUser._id,
          organizationId: req.organization._id
        });
        
        if (existingMembership) {
          return res.status(400).json({
            success: false,
            message: 'User is already a member of this organization'
          });
        }
      }

      // Check for existing pending invitation
      let existingInvitation = await Invitation.findOne({
        email,
        organizationId: req.organization._id,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (existingInvitation) {
        // In development, return the existing invitation token
        if (process.env.NODE_ENV === 'development') {
          console.log(`Existing invitation for ${email} with token: ${existingInvitation.token}`);
          console.log(`Invitation URL: ${process.env.CLIENT_URL}/accept-invitation?token=${existingInvitation.token}`);
          return res.status(200).json({
            success: true,
            message: 'Invitation already exists',
            data: {
              id: existingInvitation._id,
              email: existingInvitation.email,
              role: existingInvitation.role,
              expiresAt: existingInvitation.expiresAt,
              token: existingInvitation.token
            }
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Invitation already sent to this email'
        });
      }

      // Create invitation with token
      const crypto = require('crypto');
      const invitation = new Invitation({
        email,
        organizationId: req.organization._id,
        invitedBy: req.user._id,
        role,
        token: crypto.randomBytes(32).toString('hex')
      });
      await invitation.save();

      // Send invitation email (skip in development if email not configured)
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await sendInvitationEmail(email, req.organization.name, invitation.token);
        } else {
          console.log(`Invitation created for ${email} with token: ${invitation.token}`);
          console.log(`Invitation URL: ${process.env.CLIENT_URL}/accept-invitation?token=${invitation.token}`);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // Continue without failing the invitation creation
      }

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error) {
      console.error('Invitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending invitation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get organization invitations
 *     tags: [Invitations]
 */
router.get('/', auth, requireOrg, requirePermission('view_users'), async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const invitations = await Invitation.find({
      organizationId: req.organization._id,
      status
    }).populate({
      path: 'invitedBy',
      select: 'firstName lastName email'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invitations.map(inv => ({
        id: inv._id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        invitedBy: {
          firstName: inv.invitedBy.firstName,
          lastName: inv.invitedBy.lastName
        }
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
});

/**
 * @swagger
 * /api/invitations/{id}/resend:
 *   post:
 *     summary: Resend invitation
 *     tags: [Invitations]
 */
router.post('/:id/resend', 
  auth, 
  requireOrg, 
  requirePermission('invite_users'),
  auditLog('resend_invitation', 'invitation'),
  async (req, res) => {
    try {
      const invitation = await Invitation.findOne({
        _id: req.params.id,
        organizationId: req.organization._id,
        status: 'pending'
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      // Extend expiry
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await invitation.save();

      // Resend email
      await sendInvitationEmail(invitation.email, req.organization.name, invitation.token);

      res.json({
        success: true,
        message: 'Invitation resent successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error resending invitation'
      });
    }
  }
);

/**
 * @swagger
 * /api/invitations/{id}:
 *   delete:
 *     summary: Cancel invitation
 *     tags: [Invitations]
 */
router.delete('/:id', 
  auth, 
  requireOrg, 
  requirePermission('invite_users'),
  auditLog('cancel_invitation', 'invitation'),
  async (req, res) => {
    try {
      const invitation = await Invitation.findOneAndDelete({
        _id: req.params.id,
        organizationId: req.organization._id,
        status: 'pending'
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling invitation'
      });
    }
  }
);

/**
 * @swagger
 * /api/invitations/accept:
 *   post:
 *     summary: Accept invitation and create account
 *     tags: [Invitations]
 */
router.post('/accept', validate(schemas.acceptInvitation), async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    // Find valid invitation
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('organizationId');

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: invitation.email });
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = new User({
        email: invitation.email,
        password,
        firstName,
        lastName,
        isEmailVerified: true
      });
      await user.save();
      isNewUser = true;
    }

    // Create membership
    const membership = new Membership({
      userId: user._id,
      organizationId: invitation.organizationId._id,
      role: invitation.role,
      invitedBy: invitation.invitedBy
    });
    await membership.save();

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isNewUser
        },
        organization: {
          id: invitation.organizationId._id,
          name: invitation.organizationId.name,
          role: invitation.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation'
    });
  }
});

/**
 * @swagger
 * /api/invitations/verify/{token}:
 *   get:
 *     summary: Verify invitation token
 *     tags: [Invitations]
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Verifying token:', token);

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('organizationId');

    console.log('Found invitation:', invitation ? 'Yes' : 'No');
    if (!invitation) {
      console.log('Searching for any invitation with this token...');
      const anyInvitation = await Invitation.findOne({ token });
      console.log('Any invitation found:', anyInvitation);
    }

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });

    res.json({
      success: true,
      data: {
        email: invitation.email,
        organizationName: invitation.organizationId.name,
        role: invitation.role,
        userExists: !!existingUser
      }
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying invitation'
    });
  }
});

module.exports = router;