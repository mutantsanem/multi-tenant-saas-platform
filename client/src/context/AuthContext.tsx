import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Organization, AuthTokens } from '../types';
import apiService from '../services/api';

interface AuthState {
  user: User | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; organizations: Organization[]; tokens: AuthTokens } }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: Organization }
  | { type: 'UPDATE_ORGANIZATIONS'; payload: Organization[] };

const initialState: AuthState = {
  user: null,
  organizations: [],
  currentOrganization: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      const { user, organizations, tokens } = action.payload;
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      
      // Set first organization as current if none selected
      const currentOrg = organizations.length > 0 ? organizations[0] : null;
      if (currentOrg) {
        apiService.setCurrentOrganization(currentOrg.id);
      }
      
      return {
        ...state,
        user,
        organizations,
        currentOrganization: currentOrg,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentOrgId');
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_CURRENT_ORGANIZATION':
      apiService.setCurrentOrganization(action.payload.id);
      return {
        ...state,
        currentOrganization: action.payload,
      };
    case 'UPDATE_ORGANIZATIONS':
      return {
        ...state,
        organizations: action.payload,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string }) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentOrganization: (org: Organization) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const currentOrgId = localStorage.getItem('currentOrgId');
      
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          const { user, organizations } = response.data.data!;
          
          // Find current organization
          const currentOrg = currentOrgId 
            ? organizations.find(org => org.id === currentOrgId) || organizations[0]
            : organizations[0];
          
          if (currentOrg) {
            apiService.setCurrentOrganization(currentOrg.id);
          }
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              organizations,
              tokens: {
                accessToken: token,
                refreshToken: localStorage.getItem('refreshToken') || ''
              }
            }
          });
        } catch (error) {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      const { user, organizations, tokens } = response.data.data!;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, organizations, tokens }
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; organizationName: string }) => {
    try {
      const response = await apiService.register(data);
      const { user, organization, tokens } = response.data.data!;
      
      const organizations = [{
        id: organization.id,
        name: organization.name,
        role: 'owner' as const
      }];
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, organizations, tokens }
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    }
    dispatch({ type: 'LOGOUT' });
  };

  const setCurrentOrganization = (org: Organization) => {
    dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: org });
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      const { organizations } = response.data.data!;
      dispatch({ type: 'UPDATE_ORGANIZATIONS', payload: organizations });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    setCurrentOrganization,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};