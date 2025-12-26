const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().trim().min(1).required(),
    lastName: Joi.string().trim().min(1).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createOrganization: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    domain: Joi.string().trim().lowercase().optional(),
    timezone: Joi.string().optional()
  }),

  inviteUser: Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'member', 'viewer').default('member')
  }),

  updateUserRole: Joi.object({
    role: Joi.string().valid('admin', 'member', 'viewer').required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  }),

  acceptInvitation: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().trim().min(1).required(),
    lastName: Joi.string().trim().min(1).required()
  })
};

module.exports = {
  validate,
  schemas
};