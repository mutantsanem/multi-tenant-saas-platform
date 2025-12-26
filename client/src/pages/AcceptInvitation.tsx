import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import apiService from '../services/api';
import './Auth.css';

export const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [invitationData, setInvitationData] = useState<{
    email: string;
    organizationName: string;
    role: string;
    userExists: boolean;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setVerifying(false);
      return;
    }

    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      const response = await apiService.verifyInvitation(token!);
      setInvitationData(response.data.data!);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired invitation');
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.acceptInvitation({
        token,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      const { user, organization, tokens } = response.data.data!;
      
      // If user already exists, just log them in
      if (invitationData?.userExists) {
        await login(invitationData.email, formData.password);
      } else {
        // For new users, set up auth context
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Verifying Invitation</h1>
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Invalid Invitation</h1>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Accept Invitation</h1>
          <p>
            You've been invited to join <strong>{invitationData?.organizationName}</strong> as a{' '}
            <strong>{invitationData?.role}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <Input
            type="email"
            label="Email"
            value={invitationData?.email || ''}
            disabled
          />

          {!invitationData?.userExists && (
            <>
              <div className="form-row">
                <Input
                  type="text"
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="text"
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <Input
            type="password"
            name="password"
            label={invitationData?.userExists ? "Your Password" : "Create Password"}
            value={formData.password}
            onChange={handleChange}
            required
            helperText={invitationData?.userExists 
              ? "Enter your existing password" 
              : "Minimum 6 characters"
            }
          />

          <Button type="submit" loading={loading} className="auth-button">
            {invitationData?.userExists ? 'Join Organization' : 'Create Account & Join'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitation;