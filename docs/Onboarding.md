# MetaSys ERP - Developer Onboarding

Welcome to the MetaSys ERP project! This document will help you get set up and understand the key components of the system.

## Project Overview

MetaSys ERP is a comprehensive Enterprise Resource Planning system designed specifically for logistics operations. The platform includes modules for:

- Sales and Lead Management
- Dispatch Operations
- HR and Hiring
- Finance and Invoicing
- Client Portal

## Setup Instructions

Follow these steps to set up your local development environment:

### Prerequisites

1. Node.js 20.x or higher
2. PostgreSQL 14.x or higher
3. Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd metasys-erp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your local database credentials and other required settings.

4. Set up the database:
   ```bash
   # Create database tables
   npm run db:push
   
   # Seed initial data (admin user, roles, etc.)
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api
   - Health check: http://localhost:5000/health

### Default Credentials

For local development, you can use these credentials:

- Username: `admin`
- Password: `admin123`

## Project Structure

The project follows a modular architecture with clear separation of concerns:

```
metasys-erp/
├── client/               # React frontend
│   ├── public/           # Static assets
│   └── src/
│       ├── assets/       # Frontend assets
│       ├── components/   # Reusable components
│       ├── contexts/     # React contexts
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utility functions
│       ├── pages/        # Page components
│       ├── store/        # Redux store
│       └── types/        # TypeScript type definitions
├── server/               # Express backend
│   ├── config/           # Configuration
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── shared/               # Shared code between client and server
│   ├── constants/        # Shared constants
│   └── schema.ts         # Database schema with Drizzle
├── docs/                 # Documentation
└── public/               # Production build output
```

## Key Technologies

### Frontend
- **React**: UI library
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **TanStack Query**: Data fetching
- **Tailwind CSS**: Styling
- **Shadcn UI**: Component library
- **React Hook Form**: Form management
- **Zod**: Validation
- **Socket.IO Client**: Real-time communication

### Backend
- **Node.js**: Runtime
- **Express**: API framework
- **TypeScript**: Type safety
- **Drizzle ORM**: Database ORM
- **PostgreSQL**: Database
- **Socket.IO**: Real-time communication
- **Node-Cron**: Scheduled tasks
- **Nodemailer**: Email sending
- **Passport.js**: Authentication

## Development Workflow

### Git Workflow

We follow a GitHub Flow approach:

1. Create a feature branch from `main`
2. Implement your changes
3. Submit a PR back to `main`
4. After review, merge the PR

### Coding Standards

- **TypeScript**: Use strict type checking
- **Linting**: Follow ESLint rules
- **Formatting**: Use Prettier
- **Components**: Prefer functional components with hooks
- **Code Style**: Follow the established patterns in the codebase

### Testing

Run tests with:

```bash
npm test
```

We use:
- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **Supertest**: API testing

## Database Management

### Schema Changes

When modifying the database schema:

1. Update the schema in `shared/schema.ts`
2. Run `npm run db:push` to update the database

### Data Migrations

For data migrations, create a script in `server/scripts` and run it with:

```bash
npm run script <script-name>
```

## Key Concepts

### Authentication

Authentication uses session-based auth with Passport.js. The session contains the user ID, and the full user object with permissions is attached to the request.

### Authorization

We use role-based access control (RBAC) with permissions:

- Roles have a department and permission level
- Fine-grained permissions are checked in middleware
- Organization-level permissions restrict data access

### Real-time Updates

Socket.IO provides real-time updates:

- Notifications
- Task assignments
- Status changes
- Chat messages

### Multi-tenancy

The system supports multiple organizations:

- Users belong to an organization
- Data is scoped to organizations
- System admins can access all organizations

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check database credentials in `.env`
   - Ensure PostgreSQL is running

2. **Missing environment variables**:
   - Verify all required variables in `.env.example` are set

3. **Type errors**:
   - Run `npm run check-types` to verify all types

### Logs

Logs are available in:

- Console output during development
- `logs/` directory in production
- PostgreSQL logs for database issues

## Getting Help

If you need assistance:

1. Check the documentation in the `docs/` directory
2. Search existing GitHub issues
3. Ask in the developer Slack channel
4. Contact the tech lead