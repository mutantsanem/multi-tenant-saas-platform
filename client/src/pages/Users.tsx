import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import { Member } from '../types';
import apiService from '../services/api';
import './Users.css';

export const Users: React.FC = () => {
  const { currentOrganization } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');

  const canManageUsers = currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin';

  useEffect(() => {
    fetchMembers();
  }, [currentOrganization, search, roleFilter]);

  const fetchMembers = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const response = await apiService.getMembers(currentOrganization.id, {
        search: search || undefined,
        role: roleFilter || undefined
      });
      setMembers(response.data.data!.members || response.data.data!.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiService.updateUserRole(userId, newRole);
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId: string, isActive: boolean) => {
    try {
      await apiService.updateUserStatus(userId, !isActive);
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;

    try {
      await apiService.removeUser(userId);
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove user');
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'role-badge role-owner';
      case 'admin': return 'role-badge role-admin';
      case 'member': return 'role-badge role-member';
      case 'viewer': return 'role-badge role-viewer';
      default: return 'role-badge';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading members...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="users-page">
        <div className="users-header">
          <div>
            <h1>Team Members</h1>
            <p>Manage your organization's team members</p>
          </div>
          {canManageUsers && (
            <Link to="/users/invite">
              <Button>Invite User</Button>
            </Link>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="users-filters">
          <Input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Login</th>
                {canManageUsers && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="member-name">
                      {member.firstName} {member.lastName}
                      {member.invitedBy && (
                        <span className="invited-by">
                          Invited by {member.invitedBy.firstName} {member.invitedBy.lastName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    {canManageUsers && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={getRoleBadgeClass(member.role)}>
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${member.isActive ? 'status-active' : 'status-inactive'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(member.joinedAt).toLocaleDateString()}</td>
                  <td>
                    {member.lastLoginAt 
                      ? new Date(member.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  {canManageUsers && (
                    <td>
                      <div className="member-actions">
                        {member.role !== 'owner' && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusToggle(member.id, member.isActive)}
                            >
                              {member.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleRemoveUser(member.id)}
                            >
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length === 0 && (
          <div className="empty-state">
            <p>No members found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;