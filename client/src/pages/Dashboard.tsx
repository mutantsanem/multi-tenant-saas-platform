import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, currentOrganization } = useAuth();

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.firstName}!</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Current Organization</h3>
            <p className="stat-value">{currentOrganization?.name}</p>
            <p className="stat-label">Your role: {currentOrganization?.role}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link to="/users" className="action-card">
              <h3>Manage Users</h3>
              <p>View and manage organization members</p>
            </Link>
            
            {(currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin') && (
              <Link to="/users/invite" className="action-card">
                <h3>Invite Users</h3>
                <p>Send invitations to new team members</p>
              </Link>
            )}
            
            {currentOrganization?.role === 'owner' && (
              <Link to="/organization/settings" className="action-card">
                <h3>Organization Settings</h3>
                <p>Configure your organization preferences</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;