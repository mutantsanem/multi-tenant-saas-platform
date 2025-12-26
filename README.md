# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS web application built with Node.js, React, and MongoDB. This platform supports multiple organizations with strict data isolation, complete user management, and role-based access control.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Complete data isolation between organizations
- **User Authentication**: JWT-based auth with refresh tokens
- **Role-Based Access Control**: Owner, Admin, Member, and Viewer roles
- **Organization Management**: Create and manage organizations
- **User Onboarding**: Invitation-based user registration
- **Audit Logging**: Track all user activities

### Security Features
- Secure password hashing with bcrypt
- JWT token management with refresh tokens
- Request validation with Joi
- Rate limiting and security headers
- Tenant isolation at API and database level

### User Management
- Invite users via email
- Manage user roles and permissions
- Activate/deactivate users
- Remove users from organizations
- View user activity and login history

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Models**: User, Organization, Membership, Invitation, AuditLog
- **Middleware**: Authentication, authorization, validation, audit logging
- **Routes**: Auth, organizations, users, invitations
- **Security**: Helmet, CORS, rate limiting

### Frontend (React + TypeScript)
- **Context**: Authentication state management
- **Services**: API client with interceptors
- **Components**: Reusable UI components
- **Pages**: Login, register, dashboard, user management

### Database (MongoDB)
- **Tenant Isolation**: All queries scoped by organizationId
- **Indexes**: Optimized for multi-tenant queries
- **Relationships**: User-Organization many-to-many via Membership

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-tenant-saas-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp server/.env.example server/.env
   
   # Frontend
   echo "REACT_APP_API_URL=http://localhost:5000/api" > client/.env
   ```

4. **Configure environment variables**
   Edit `server/.env` with your settings:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/saas-platform
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   
   # Email configuration (for invitations)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@yourapp.com
   
   CLIENT_URL=http://localhost:3000
   ```

5. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

6. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or start separately
   npm run server:dev  # Backend only
   npm run client:dev  # Frontend only
   ```

## 🔧 API Documentation

The API documentation is available at `http://localhost:5000/api-docs` when the server is running.

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register user and create organization
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Organizations
- `GET /api/organizations` - Get user's organizations
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `GET /api/organizations/:id/members` - Get organization members

#### User Management
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/status` - Activate/deactivate user
- `DELETE /api/users/:id` - Remove user from organization

#### Invitations
- `POST /api/invitations` - Invite user
- `GET /api/invitations` - Get invitations
- `POST /api/invitations/:id/resend` - Resend invitation
- `DELETE /api/invitations/:id` - Cancel invitation
- `POST /api/invitations/accept` - Accept invitation

## 🔐 Multi-Tenancy Strategy

### Data Isolation
1. **Database Level**: All collections include `organizationId` field
2. **API Level**: Middleware enforces organization context
3. **Query Level**: All queries automatically scoped by organization

### Implementation Details
- **Membership Model**: Links users to organizations with roles
- **Organization Context**: Required header `X-Organization-ID`
- **Middleware Chain**: Auth → Org validation → Permission check
- **Audit Trail**: All actions logged with organization context

### Security Measures
- JWT tokens don't contain organization info (prevents tampering)
- Organization membership verified on every request
- Role-based permissions enforced at API level
- Audit logging for compliance and security

## 👥 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Owner** | Full access to everything |
| **Admin** | Manage users, settings, view all data |
| **Member** | Standard platform access |
| **Viewer** | Read-only access |

### Permission Matrix
- `manage_users`: Owner, Admin
- `manage_settings`: Owner, Admin
- `invite_users`: Owner, Admin
- `view_users`: All roles

## 🧪 Testing

### Manual Testing Flow
1. **Registration**: Create account with organization
2. **Login**: Authenticate and receive tokens
3. **Invite Users**: Send invitations to team members
4. **Accept Invitations**: New users join organization
5. **Role Management**: Change user roles and permissions
6. **Multi-org**: Users can belong to multiple organizations

### Test Scenarios
- Cross-tenant data access (should be blocked)
- Permission escalation attempts
- Token refresh and expiry
- Email invitation flow
- Organization switching

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT secrets
- [ ] Configure production MongoDB
- [ ] Set up email service (SendGrid, AWS SES)
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/saas
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
EMAIL_HOST=smtp.sendgrid.net
# ... other production configs
```

## 📁 Project Structure

```
multi-tenant-saas-platform/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, validation, audit
│   ├── utils/             # JWT, email utilities
│   └── index.js           # Server entry point
├── client/                # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (auth)
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── public/
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api-docs`
- Review the code comments and examples
- Open an issue for bugs or feature requests

## 🔄 Roadmap

- [ ] Email verification flow
- [ ] Two-factor authentication
- [ ] Advanced audit logging dashboard
- [ ] Organization billing and subscriptions
- [ ] API rate limiting per organization
- [ ] Advanced user permissions
- [ ] SSO integration
- [ ] Mobile app support