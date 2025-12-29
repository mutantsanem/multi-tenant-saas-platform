import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import apiService from '../services/api';
import './InviteUser.css';

export const InviteUser: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { currentOrganization } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
     const responce = await apiService.inviteUser({ email, role: role as any });
     alert(` invitaion link  ${process.env.REACT_APP_URL}/accept-invitation?token=${responce.data.data?.token} `);
      setSuccess('Invitation sent successfully!');
      
      setEmail('');
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const canInviteAdmin = currentOrganization?.role === 'owner';

  return (
    <Layout>
      <div className="invite-user-page">
        <div className="invite-header">
          <h1>Invite User</h1>
          <p>Send an invitation to join {currentOrganization?.name}</p>
        </div>

        <div className="invite-form-container">
          <form onSubmit={handleSubmit} className="invite-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              helperText="The user will receive an invitation email"
            />

            <div className="role-selection">
              <label className="role-label">Role</label>
              <div className="role-options">
                {canInviteAdmin && (
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <div className="role-info">
                      <span className="role-name">Admin</span>
                      <span className="role-description">Can manage users and settings</span>
                    </div>
                  </label>
                )}
                
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={role === 'member'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <div className="role-info">
                    <span className="role-name">Member</span>
                    <span className="role-description">Standard access to the platform</span>
                  </div>
                </label>
                
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="viewer"
                    checked={role === 'viewer'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <div className="role-info">
                    <span className="role-name">Viewer</span>
                    <span className="role-description">Read-only access</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/users')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Send Invitation
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default InviteUser;