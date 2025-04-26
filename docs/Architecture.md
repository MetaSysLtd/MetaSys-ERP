# MetaSys ERP - Architecture Documentation

## System Overview

MetaSys ERP is a comprehensive enterprise resource planning system built to support the operational needs of MetaSys Logistics. The system provides modules for Sales, Dispatch, HR, Finance, and Customer Management in a fully integrated platform.

## Tech Stack

The application is built on the following technology stack:

- **Frontend**: React with TypeScript, utilizing modern React patterns including hooks and context
- **UI Framework**: Tailwind CSS with Shadcn UI components 
- **State Management**: Mix of React Context API and Redux Toolkit for global state
- **API Connectivity**: TanStack Query for data fetching and caching
- **Backend**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with role-based access control
- **Real-time**: Socket.IO for real-time notifications and updates
- **Scheduled Tasks**: Node-Cron for scheduling automated tasks
- **Form Management**: React Hook Form with Zod validation
- **Email**: Nodemailer for email delivery
- **External APIs**: Stripe for payments, Slack for notifications

## Architecture Diagram

```
┌─────────────────┐           ┌─────────────────┐
│                 │           │                 │
│  React Frontend │◄──HTTP──►│  Express Backend │
│                 │           │                 │
└────────┬────────┘           └────────┬────────┘
         │                             │
         │                             │
         │                             │
         │                    ┌────────▼────────┐
         │                    │                 │
         └────WebSocket──────►│   PostgreSQL    │
                              │                 │
                              └─────────────────┘
```

## Key Components

### Frontend Architecture

The frontend is structured around the following key concepts:

1. **Routing**: Uses Wouter for client-side routing
2. **Authentication**: AuthContext provides global user state and auth methods
3. **Components**: Follows atomic design with UI, layout, and feature components
4. **Data Fetching**: TanStack Query for API interactions with caching
5. **Forms**: React Hook Form with Zod schema validation
6. **Notifications**: Custom toast system and real-time notifications via sockets
7. **Error Handling**: Global error boundary and API error interceptors

### Backend Architecture

The backend follows a modular architecture:

1. **API Routes**: RESTful endpoints organized by resource
2. **Middleware**: Authentication, error handling, validation
3. **Services**: Business logic separated into service layer
4. **Storage**: Database abstraction through Drizzle ORM
5. **WebSockets**: Real-time communication with clients
6. **Scheduled Tasks**: Automated jobs for reports and notifications
7. **Email Templates**: Standardized templates for various communication

### Database Schema

The database schema is organized around these core entities:

1. **Users**: System users with roles and permissions
2. **Organizations**: Multi-tenant structure for client separation
3. **Roles**: Role-based access control definitions
4. **Leads**: Sales lead tracking and management
5. **Loads**: Dispatch and logistics tracking
6. **Tasks**: Task management for users
7. **Notifications**: System notifications storage
8. **HR**: Candidates, employees, time tracking, leave management
9. **Finance**: Invoices, payments, expenses

## Security Architecture

1. **Authentication**: Session-based with secure cookie storage
2. **Authorization**: Role-based with fine-grained permission checks
3. **Data Validation**: Input validation using Zod schemas
4. **SQL Injection Protection**: Parameterized queries via ORM
5. **XSS Protection**: React's built-in output encoding
6. **CSRF Protection**: Token-based protection for sensitive operations
7. **Error Handling**: Sanitized error responses in production

## Performance Considerations

1. **Caching**: TanStack Query's caching layer for frontend
2. **Connection Pooling**: Database connection management
3. **Efficient Queries**: ORM optimization with selective columns
4. **Pagination**: API endpoints support pagination for large datasets
5. **Static Asset Optimization**: Build-time optimization for frontend assets

## Deployment Architecture

The application is deployed with the following considerations:

1. **Environment Configuration**: Different configs for dev/prod
2. **Database Migrations**: Schema changes managed through Drizzle
3. **Logging**: Centralized logging system for monitoring
4. **Error Tracking**: Production error capturing
5. **Health Monitoring**: Health check endpoints for monitoring

## Integration Points

1. **Slack**: Notifications for teams and activity updates
2. **Email**: Customer and internal communications
3. **Stripe**: Payment processing
4. **External APIs**: Integration with third-party logistics systems

## Error Handling Strategy

The application implements a comprehensive error handling strategy:

1. **Client-side**: 
   - Global error boundary for React component errors
   - API request interceptors for network error handling
   - Form validation errors with user-friendly messages
   - Socket connection error recovery

2. **Server-side**:
   - Global Express error middleware
   - Standardized API error responses
   - Error logging and monitoring
   - Database transaction error handling

3. **Production vs Development**:
   - Detailed errors in development
   - Sanitized error messages in production
   - Production error tracking and alerting

## Audit and Logging

1. **Audit Trails**: Critical actions are logged with user info
2. **Activity Logging**: User activity tracking
3. **Error Logging**: Structured error logs with context
4. **Performance Metrics**: API response time monitoring

## Scalability Considerations

1. **Horizontal Scaling**: API endpoints are stateless for scaling
2. **Database Optimization**: Indexing strategy for performance
3. **Load Balancing**: Support for multiple backend instances
4. **Caching Strategy**: Optimized data retrieval patterns