const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  settings: {
    allowedEmailDomains: [String],
    allowSelfSignup: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

organizationSchema.index({ name: 1 });
// organizationSchema.index({ domain: 1 }); // Removed duplicate index

module.exports = mongoose.model('Organization', organizationSchema);