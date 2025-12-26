import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Organization } from '../types';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, organizations, currentOrganization, setCurrentOrganization, logout } = useAuth();

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">SaaS Platform</h1>
            {currentOrganization && (
              <div className="org-selector">
                <select value={currentOrganization.id} onChange={handleOrgChange}>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="header-right">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;