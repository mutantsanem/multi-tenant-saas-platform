const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'viewer'],
    default: 'member'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
membershipSchema.index({ organizationId: 1, role: 1 });
membershipSchema.index({ userId: 1 });

// Static method to check permissions
membershipSchema.statics.hasPermission = function(role, action) {
  const permissions = {
    owner: ['all'],
    admin: ['manage_users', 'manage_settings', 'view_users', 'invite_users'],
    member: ['view_users'],
    viewer: ['view_users']
  };
  
  return permissions[role]?.includes(action) || permissions[role]?.includes('all');
};

module.exports = mongoose.model('Membership', membershipSchema);