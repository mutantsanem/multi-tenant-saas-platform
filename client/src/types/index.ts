export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLoginAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt?: string;
  isActive?: boolean;
  timezone?: string;
  settings?: {
    allowedEmailDomains?: string[];
    allowSelfSignup?: boolean;
  };
  memberCount?: number;
}

export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  isActive: boolean;
  joinedAt: string;
  lastLoginAt?: string;
  invitedBy?: {
    firstName: string;
    lastName: string;
  };
}

export interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    firstName: string;
    lastName: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  organizations: Organization[];
  organization?: Organization;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  organization: Organization;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface InviteUserRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  members?: T[];
  data?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}