# MetaSys ERP - Folder Structure

This document outlines the folder structure of the MetaSys ERP project and explains the purpose of each directory and key files.

## Root Directory

```
metasys-erp/
├── client/               # React frontend
├── docs/                 # Documentation
├── logs/                 # Log files in production
├── public/               # Production build output
├── server/               # Express backend
├── shared/               # Shared code between client and server
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore patterns
├── drizzle.config.ts     # Drizzle ORM configuration
├── package.json          # NPM package definition
├── README.md             # Project README
├── tailwind.config.ts    # Tailwind CSS configuration
├── theme.json            # Theme configuration for UI
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## Client Directory

```
client/
├── public/               # Static assets
│   └── favicon.ico       # Site favicon
├── src/
│   ├── assets/           # Frontend assets
│   │   ├── images/       # Image assets
│   │   ├── icons/        # Icon assets
│   │   └── styles/       # Global styles
│   ├── components/       # Reusable components
│   │   ├── ui/           # Base UI components
│   │   ├── layout/       # Layout components
│   │   ├── forms/        # Form components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── sales/        # Sales module components
│   │   ├── dispatch/     # Dispatch module components
│   │   ├── hr/           # HR module components
│   │   └── finance/      # Finance module components
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx      # Authentication context
│   │   ├── NotificationContext.tsx # Notifications context
│   │   ├── ThemeContext.tsx     # Theme context
│   │   └── SocketContext.tsx    # Socket.IO context
│   ├── hooks/            # Custom hooks
│   │   ├── useAuth.ts           # Authentication hook
│   │   ├── useSocket.ts         # Socket.IO hook
│   │   ├── useToast.ts          # Toast notifications hook
│   │   ├── useForm.ts           # Form handling hook
│   │   └── useLocalStorage.ts   # Local storage hook
│   ├── lib/              # Utility functions
│   │   ├── api-client.ts        # API client utilities
│   │   ├── date-utils.ts        # Date formatting utilities
│   │   ├── storage-utils.ts     # Storage utilities
│   │   ├── api-error-handler.ts # API error handling
│   │   ├── global-error-handler.ts # Global error handling
│   │   └── queryClient.ts       # TanStack Query client setup
│   ├── pages/            # Page components
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── sales/              # Sales module pages
│   │   ├── dispatch/           # Dispatch module pages
│   │   ├── hr/                 # HR module pages
│   │   └── finance/            # Finance module pages
│   ├── store/            # Redux store
│   │   ├── slices/             # Redux slices
│   │   └── index.ts            # Redux store configuration
│   ├── types/            # TypeScript type definitions
│   │   ├── api.ts              # API response types
│   │   ├── auth.ts             # Authentication types
│   │   ├── user.ts             # User related types
│   │   └── common.ts           # Common type definitions
│   ├── App.tsx           # Main App component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global CSS
└── index.html            # HTML entry point
```

## Server Directory

```
server/
├── config/               # Configuration
│   ├── env.ts                 # Environment configuration
│   ├── constants.ts           # Application constants
│   └── logger-config.ts       # Logger configuration
├── middleware/           # Express middleware
│   ├── auth.ts                # Authentication middleware
│   ├── error-handler.ts       # Error handling middleware
│   ├── validation.ts          # Request validation middleware
│   └── cors.ts                # CORS configuration
├── routes/               # API routes
│   ├── auth.ts                # Authentication routes
│   ├── users.ts               # User management routes
│   ├── organizations.ts       # Organization routes
│   ├── sales.ts               # Sales module routes
│   ├── dispatch.ts            # Dispatch module routes
│   ├── hr.ts                  # HR module routes
│   ├── finance.ts             # Finance module routes
│   ├── status.ts              # Status routes
│   └── error-logging.ts       # Error logging routes
├── services/             # Business logic
│   ├── auth-service.ts        # Authentication service
│   ├── user-service.ts        # User management service
│   ├── organization-service.ts # Organization service
│   ├── notification-service.ts # Notification service
│   ├── email-service.ts       # Email service
│   ├── slack-service.ts       # Slack integration service
│   ├── dispatch-service.ts    # Dispatch operations service
│   ├── sales-service.ts       # Sales operations service
│   ├── hr-service.ts          # HR operations service
│   ├── finance-service.ts     # Finance operations service
│   ├── socket.ts              # Socket.IO service
│   ├── audit-logger.ts        # Audit logging service
│   └── permissions.ts         # Permission checking service
├── utils/                # Utility functions
│   ├── date-utils.ts          # Date utilities
│   ├── string-utils.ts        # String utilities
│   ├── validation-utils.ts    # Validation utilities
│   ├── crypto-utils.ts        # Cryptography utilities
│   ├── db-health-check.ts     # Database health checking
│   └── pagination.ts          # Pagination utilities
├── db.ts                 # Database connection
├── index.ts              # Application entry point
├── routes.ts             # API routes registration
├── storage.ts            # Storage interface
├── dispatch-report-automation.ts  # Dispatch report automation
├── email.ts              # Email templates and sending
├── invoiceTemplates.ts   # Invoice email templates
├── logger.ts             # Logging service
└── vite.ts               # Vite server integration
```

## Shared Directory

```
shared/
├── constants/           # Shared constants
│   ├── errors.ts         # Error codes and messages
│   ├── permissions.ts    # Permission definitions
│   ├── roleTypes.ts      # Role type definitions
│   └── statuses.ts       # Status definitions
├── schema.ts            # Database schema with Drizzle
└── types.ts             # Shared type definitions
```

## Docs Directory

```
docs/
├── Architecture.md       # System architecture overview
├── API.md                # API documentation
├── Onboarding.md         # Developer onboarding guide
├── FolderStructure.md    # This folder structure document
├── DataModel.md          # Database model documentation
└── Deployment.md         # Deployment instructions
```

## Key Files

### Root Level

- **package.json**: Defines project dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **vite.config.ts**: Vite bundler configuration
- **drizzle.config.ts**: Drizzle ORM configuration
- **.env.example**: Example environment variables
- **theme.json**: UI theme configuration

### Server

- **server/index.ts**: Application entry point
- **server/db.ts**: Database connection setup
- **server/routes.ts**: API route registration
- **server/storage.ts**: Data storage interface
- **server/middleware/error-handler.ts**: Error handling middleware
- **server/middleware/auth.ts**: Authentication middleware

### Client

- **client/src/main.tsx**: Frontend entry point
- **client/src/App.tsx**: Main application component
- **client/src/contexts/AuthContext.tsx**: Authentication context
- **client/src/lib/api-client.ts**: API client utilities
- **client/src/lib/queryClient.ts**: TanStack Query setup
- **client/src/components/ui/error-boundary.tsx**: Error boundary component

### Shared

- **shared/schema.ts**: Database schema definitions
- **shared/constants/errors.ts**: Error code definitions

## Understanding the Structure

### Separation of Concerns

The project follows a clear separation of concerns:

1. **Client**: Frontend React application
2. **Server**: Backend Express API
3. **Shared**: Code shared between client and server

### Modular Organization

Each module of the application (Sales, Dispatch, HR, Finance) has its own:

1. Frontend components in `client/src/components/{module}`
2. Frontend pages in `client/src/pages/{module}`
3. Backend routes in `server/routes/{module}.ts`
4. Backend services in `server/services/{module}-service.ts`

### Service-Oriented Architecture

The backend follows a service-oriented approach:

1. **Routes**: Handle HTTP requests and responses
2. **Services**: Contain business logic
3. **Storage**: Database access layer
4. **Middleware**: Cross-cutting concerns

### Frontend Component Structure

The frontend components follow a hierarchy:

1. **Base UI Components**: Reusable UI primitives
2. **Layout Components**: Page layouts and structures
3. **Feature Components**: Domain-specific components
4. **Page Components**: Full pages composed of other components

## Best Practices

When extending the application:

1. Follow the established patterns in each directory
2. Keep components focused on a single responsibility
3. Place shared code in the appropriate shared directories
4. Maintain separation between UI, business logic, and data access
5. Document new components and services
6. Update this folder structure document when adding new directories