const AuditLog = require('../models/AuditLog');

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400 && req.user && req.organization) {
        AuditLog.create({
          organizationId: req.organization._id,
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id || req.params.userId || data?.data?._id,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined,
            params: req.params,
            query: req.query
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }).catch(err => console.error('Audit log error:', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = auditLog;