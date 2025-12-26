// Simple in-memory database for development when MongoDB is not available
const users = new Map();
const organizations = new Map();
const memberships = new Map();
const invitations = new Map();
const auditLogs = new Map();

let idCounter = 1;

const generateId = () => (idCounter++).toString();

const mockDb = {
  users,
  organizations,
  memberships,
  invitations,
  auditLogs,
  generateId
};

module.exports = mockDb;