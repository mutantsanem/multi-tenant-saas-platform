import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  RegisterResponse,
  User,
  Organization,
  Member,
  Invitation,
  InviteUserRequest,
  AcceptInvitationRequest,
  PaginatedResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private currentOrgId: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (this.currentOrgId) {
          config.headers['X-Organization-ID'] = this.currentOrgId;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.data.data!.accessToken);
              localStorage.setItem('refreshToken', response.data.data!.refreshToken);
              
              // Retry original request
              error.config.headers.Authorization = `Bearer ${response.data.data!.accessToken}`;
              return this.api.request(error.config);
            } catch (refreshError) {
              this.clearTokens();
            }
          } else {
            this.clearTokens();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setCurrentOrganization(orgId: string) {
    this.currentOrgId = orgId;
    localStorage.setItem('currentOrgId', orgId);
  }

  getCurrentOrganization(): string | null {
    return this.currentOrgId || localStorage.getItem('currentOrgId');
  }

  private clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentOrgId');
    window.location.href = '/login';
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AxiosResponse<ApiResponse<RegisterResponse>>> {
    return this.api.post('/auth/register', data);
  }

  async login(data: LoginRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> {
    return this.api.post('/auth/login', data);
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<ApiResponse<{ accessToken: string; refreshToken: string }>>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout(): Promise<AxiosResponse<ApiResponse>> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.api.post('/auth/logout', { refreshToken });
  }

  async forgotPassword(email: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  async getCurrentUser(): Promise<AxiosResponse<ApiResponse<{ user: User; organizations: Organization[] }>>> {
    return this.api.get('/auth/me');
  }

  // Organization endpoints
  async getOrganizations(): Promise<AxiosResponse<ApiResponse<Organization[]>>> {
    return this.api.get('/organizations');
  }

  async getOrganization(id: string): Promise<AxiosResponse<ApiResponse<Organization>>> {
    return this.api.get(`/organizations/${id}`);
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<AxiosResponse<ApiResponse<Organization>>> {
    return this.api.put(`/organizations/${id}`, data);
  }

  async getMembers(orgId: string, params?: { page?: number; limit?: number; search?: string; role?: string }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<Member>>>> {
    return this.api.get(`/organizations/${orgId}/members`, { params });
  }

  // User management endpoints
  async updateUserRole(userId: string, role: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.put(`/users/${userId}/role`, { role });
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<AxiosResponse<ApiResponse>> {
    return this.api.put(`/users/${userId}/status`, { isActive });
  }

  async removeUser(userId: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.delete(`/users/${userId}`);
  }

  async getUser(userId: string): Promise<AxiosResponse<ApiResponse<Member>>> {
    return this.api.get(`/users/${userId}`);
  }

  // Invitation endpoints
  async inviteUser(data: InviteUserRequest): Promise<AxiosResponse<ApiResponse<Invitation>>> {
    return this.api.post('/invitations', data);
  }

  async getInvitations(status?: string): Promise<AxiosResponse<ApiResponse<Invitation[]>>> {
    return this.api.get('/invitations', { params: { status } });
  }

  async resendInvitation(id: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post(`/invitations/${id}/resend`);
  }

  async cancelInvitation(id: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.delete(`/invitations/${id}`);
  }

  async verifyInvitation(token: string): Promise<AxiosResponse<ApiResponse<{ email: string; organizationName: string; role: string; userExists: boolean }>>> {
    return this.api.get(`/invitations/verify/${token}`);
  }

  async acceptInvitation(data: AcceptInvitationRequest): Promise<AxiosResponse<ApiResponse<RegisterResponse>>> {
    return this.api.post('/invitations/accept', data);
  }
}

export default new ApiService();