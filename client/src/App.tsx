import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from 'react-redux';
import { store } from './store/store';
import { queryClient } from "./lib/queryClient";
import { useSocket, SocketProvider } from './hooks/use-socket';
import { LeadNotificationProvider } from './hooks/use-lead-notifications';
import { useDispatch } from 'react-redux';
import { setPreferences, fetchPreferences } from './store/uiPreferencesSlice';
import { useRealTime } from './hooks/use-real-time';
import { useToast } from '@/hooks/use-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ForgotPassword from "@/pages/auth/forgot-password";
// Use original dashboard with enhanced error handling
import Dashboard from "@/pages/dashboard";
import CRMPage from "@/pages/crm";
import ContactDetails from "@/pages/crm/[id]";
import CRMLeadsPage from "@/pages/crm/leads";
import CRMClientsPage from "@/pages/crm/clients";
import CRMCommissionsPage from "@/pages/crm/commissions";
import CRMAccountsPage from "@/pages/crm/accounts";
import CRMSurveysPage from "@/pages/crm/surveys";
import CRMActivitiesPage from "@/pages/crm/activities";
import DispatchPage from "@/pages/dispatch";
import DispatchClientsPage from "@/pages/dispatch/clients";
import DispatchLoadsPage from "@/pages/dispatch/loads";
import NewLoadPage from "@/pages/dispatch/new-load";
import TrackingPage from "@/pages/dispatch/tracking";
import DispatchTasksPage from "@/pages/dispatch/tasks";
import DispatchReportsPage from "@/pages/dispatch/reports";
import PerformanceTargetsPage from "@/pages/dispatch/targets";
import InvoicesPage from "@/pages/invoices";
import InvoiceDetailsPage from "@/pages/invoices/[id]";
import TasksPage from "@/pages/tasks";
import TimeTrackingPage from "@/pages/time-tracking";
import TimeOffPage from "@/pages/time-off";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/settings/profile";
import AdminDashboard from "@/pages/admin";
import AdminManagementPage from "@/pages/admin/management";
import AdminUsersPage from "@/pages/admin/users";
import AdminRolesPage from "@/pages/admin/roles";
import AdminOrganizationsPage from "@/pages/admin/organizations";
import AdminCommissionsPage from "@/pages/admin/commissions";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminTasksPage from "@/pages/admin/tasks";
import AdminReportsPage from "@/pages/admin/reports";
import BugsPage from "@/pages/admin/bugs";
import HRPage from "@/pages/hr";
import HRPoliciesPage from "@/pages/hr/policies";
import FinancePage from "@/pages/finance";
import MarketingPage from "@/pages/marketing";
import NotificationsPage from "@/pages/notifications";
import GamificationPage from "@/pages/gamification";
import LeaderboardPage from "@/pages/leaderboard";
import ClientPortalPage from "@/pages/client-portal";
import CommissionPoliciesPage from "@/pages/settings/commission-policies";
import DesignSystemPage from "@/pages/design-system";
// Team pages
import SalesTeamPage from "@/pages/teams/sales";
import DispatchTeamPage from "@/pages/teams/dispatch";

import { NotificationProvider } from "@/contexts/NotificationContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { AnimationProvider } from "@/contexts/AnimationContext";
import { OrganizationProvider } from "@/hooks/use-organization";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import TeamManagementPage from "@/pages/settings/teams";

// Import the MetaSys logo
import metaSysLogo from "@/assets/logos/MetaSys.png";

// Improved ProtectedRoute with quick skeleton rendering
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [authValidated, setAuthValidated] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState("");
  
  // Set a timeout for the auth check
  useEffect(() => {
    // If auth is taking too long (10s), show a timeout message
    const timeoutTimer = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth check taking too long (10s timeout reached)");
        setAuthTimeout(true);
        setTimeoutMessage("Authentication is taking longer than expected");
      }
    }, 10000);
    
    // A final backstop timeout (30s) - force an auth failure path if it's really stuck
    const criticalTimeoutTimer = setTimeout(() => {
      if (isLoading) {
        console.error("Critical auth timeout reached (30s) - forcing route resolution");
        setAuthTimeout(true);
        setAuthValidated(true); // Force validation to move forward with routing
        setTimeoutMessage("Session authentication has timed out. Please try refreshing the page.");
      }
    }, 30000);
    
    return () => {
      clearTimeout(timeoutTimer);
      clearTimeout(criticalTimeoutTimer);
    };
  }, [isLoading]);
  
  // Track whether we've completed an auth check
  useEffect(() => {
    // Only consider auth validated once loading is complete
    if (!isLoading) {
      console.log("Auth loading complete, validation state:", { isAuthenticated, error });
      setAuthValidated(true);
    }
  }, [isLoading, isAuthenticated, error]);
  
  // Always show skeleton UI immediately for perceived performance
  useEffect(() => {
    // Remove skeleton after component renders or 400ms, whichever is longer
    // This prevents jarring flash of loading screen for quick responses
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle session check and redirection with a separate effect
  useEffect(() => {
    // Only run this logic when we know the auth state is settled
    if (authValidated && !isLoading && !isAuthenticated && !redirecting) {
      console.log("Auth validation complete, not authenticated, redirecting to login");
      setRedirecting(true);
      
      // Add a small delay before redirecting to avoid race conditions
      const redirectTimer = setTimeout(() => {
        // Use wouter navigation instead of window.location for cleaner transitions
        window.location.href = "/auth";
      }, 150);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [authValidated, isLoading, isAuthenticated, redirecting]);

  // If we're redirecting, keep showing the loading state
  if (redirecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metaSysLogo} alt="MetaSys" className="w-40 mb-4 animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D3557]" />
          <span className="text-[#1D3557] font-medium">Redirecting to login page...</span>
        </div>
      </div>
    );
  }

  // Show auth timeout error if needed
  if (authTimeout && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metaSysLogo} alt="MetaSys" className="w-40 mb-4" />
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <div className="text-amber-600 font-medium text-lg mb-2">
            {timeoutMessage || "Authentication is taking longer than expected"}
          </div>
          <p className="text-gray-600 text-sm mb-4">
            This could be due to network issues or server load. You can wait or try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#025E73] text-white rounded-md hover:bg-[#014558] transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If auth is loading or we haven't validated yet, show full loading screen
  if ((isLoading && !showSkeleton) || !authValidated) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metaSysLogo} alt="MetaSys" className="w-40 mb-4 animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D3557]" />
          <span className="text-[#1D3557] font-medium">Loading your session...</span>
        </div>
      </div>
    );
  }

  // If there's an auth error but we're not redirecting
  if (error && !redirecting && authValidated && !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metaSysLogo} alt="MetaSys" className="w-40 mb-4" />
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <div className="text-red-600 font-medium text-lg mb-2">
            Authentication Error
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.href = "/auth"}
            className="px-4 py-2 bg-[#025E73] text-white rounded-md hover:bg-[#014558] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton initially while everything loads
  if (showSkeleton) {
    return (
      <div className="w-full min-h-screen bg-background">
        {/* App header skeleton */}
        <header className="w-full h-16 border-b px-4 flex items-center justify-between bg-white">
          <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-md"></div>
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
        </header>
        
        {/* Main content skeleton */}
        <div className="flex w-full">
          {/* Left sidebar skeleton */}
          <div className="hidden md:block w-64 h-screen border-r bg-white">
            <div className="p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-md animate-pulse" 
                  style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
          </div>
          
          {/* Main content area skeleton */}
          <div className="flex-1 p-6 space-y-6">
            <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-md animate-pulse" 
                  style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  // Finally render the actual component
  return <Component {...rest} />;
}

// We'll use direct imports for now until we establish a solid lazy loading setup
// This will be revisited in a future optimization

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/login">
        <AuthPage />
      </Route>
      <Route path="/auth/forgot-password">
        <ForgotPassword />
      </Route>

      <Route path="/">
        {() => (
          <AppLayout>
            <ProtectedRoute component={Dashboard} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/leads">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMLeadsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/clients">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMClientsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/commissions">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMCommissionsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/accounts">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMAccountsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/surveys">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMSurveysPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/activities">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CRMActivitiesPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/crm/:id">
        {(params) => (
          <AppLayout>
            <ProtectedRoute component={ContactDetails} params={params} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DispatchPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/clients">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DispatchClientsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/loads">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DispatchLoadsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/new-load">
        {() => (
          <AppLayout>
            <ProtectedRoute component={NewLoadPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/tracking">
        {() => (
          <AppLayout>
            <ProtectedRoute component={TrackingPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/tasks">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DispatchTasksPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/reports">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DispatchReportsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/dispatch/targets">
        {() => (
          <AppLayout>
            <ProtectedRoute component={PerformanceTargetsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/invoices">
        {() => (
          <AppLayout>
            <ProtectedRoute component={InvoicesPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/invoices/:id">
        {(params) => (
          <AppLayout>
            <ProtectedRoute component={InvoiceDetailsPage} params={params} />
          </AppLayout>
        )}
      </Route>

      <Route path="/reports">
        {() => (
          <AppLayout>
            <ProtectedRoute component={ReportsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/settings">
        {() => (
          <AppLayout>
            <ProtectedRoute component={SettingsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/settings/profile">
        {() => (
          <AppLayout>
            <ProtectedRoute component={ProfilePage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/settings/commission-policies">
        {() => (
          <AppLayout>
            <ProtectedRoute component={CommissionPoliciesPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminDashboard} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/management">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminManagementPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/users">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminUsersPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/roles">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminRolesPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/organizations">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminOrganizationsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/commissions">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminCommissionsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/settings">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminSettingsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/tasks">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminTasksPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/reports">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminReportsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/admin/bugs">
        {() => (
          <AppLayout>
            <ProtectedRoute component={BugsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/hr">
        {() => (
          <AppLayout>
            <ProtectedRoute component={HRPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/finance">
        {() => (
          <AppLayout>
            <ProtectedRoute component={FinancePage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/marketing">
        {() => (
          <AppLayout>
            <ProtectedRoute component={MarketingPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/notifications">
        {() => (
          <AppLayout>
            <ProtectedRoute component={NotificationsPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/tasks">
        {() => (
          <AppLayout>
            <ProtectedRoute component={TasksPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/time-tracking">
        {() => (
          <AppLayout>
            <ProtectedRoute component={TimeTrackingPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/time-off">
        {() => (
          <AppLayout>
            <ProtectedRoute component={TimeOffPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/hr/policies">
        {() => (
          <AppLayout>
            <ProtectedRoute component={HRPoliciesPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/teams/sales">
        {() => (
          <AppLayout>
            <ProtectedRoute component={SalesTeamPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/teams/dispatch">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DispatchTeamPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/leaderboard">
        {() => (
          <AppLayout>
            <ProtectedRoute component={LeaderboardPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/gamification">
        {() => (
          <AppLayout>
            <ProtectedRoute component={GamificationPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/client-portal">
        {() => (
          <AppLayout>
            <ProtectedRoute component={ClientPortalPage} />
          </AppLayout>
        )}
      </Route>

      <Route path="/design-system">
        {() => (
          <AppLayout>
            <ProtectedRoute component={DesignSystemPage} />
          </AppLayout>
        )}
      </Route>
       <Route path="/settings/teams">
        {() => (
          <AppLayout>
            <ProtectedRoute component={TeamManagementPage} />
          </AppLayout>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// Import the ErrorBoundary component and error handlers
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { retryFetch, handleApiError } from '@/lib/api-error-handler';
import { initializeGlobalErrorHandlers } from '@/lib/global-error-handler';

function App() {
  // Initialize global error handlers
  useEffect(() => {
    // Initialize global error handlers for uncaught exceptions and unhandled rejections
    initializeGlobalErrorHandlers();

    // Log that error handlers were initialized
    console.log('MetaSys ERP global error handling initialized');
  }, []);

  // No need for these listeners as they're now handled by the global error handler

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <MessageProvider>
                  <AnimationProvider>
                    <OrganizationProvider>
                      <LeadNotificationProvider>
                        <AppContent />
                        <Toaster />
                      </LeadNotificationProvider>
                    </OrganizationProvider>
                  </AnimationProvider>
                </MessageProvider>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

function AppContent() {
  const dispatch = useDispatch<any>();
  const { socket } = useSocket();
  const { user } = useAuth(); // Using the AuthContext's hook
  const { toast } = useToast();
  const { subscribe, isConnected } = useRealTime({
    onReconnect: (data) => {
      console.log('Real-time connection restored:', data);
    },
    onError: (error) => {
      console.error('Real-time connection error:', error);
    },
    handleSystemMessage: (message) => {
      toast({
        title: message.title || "System Message",
        description: message.message || "A system message was received.",
        variant: message.variant || "default",
      });
    }
  });

  // Load UI preferences when user logs in
  useEffect(() => {
    if (user) {
      dispatch(fetchPreferences());
    }
  }, [user, dispatch]);

  // Set up real-time data updates for the entire application
  useEffect(() => {
    if (user && isConnected) {
      // Subscribe to UI preferences updates from the real-time system
      const unsubscribeUiPrefs = subscribe('uiPrefsUpdated', (prefs: any) => {
        dispatch(setPreferences(prefs));
      });

      // Subscribe to notifications through the real-time system
      const unsubscribeNotifications = subscribe('notification:created', () => {
        // Invalidate notifications query to refresh notification data
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      });

      // Subscribe to general data updates
      const unsubscribeDataUpdates = subscribe('data:updated', (data: any) => {
        console.log('Real-time data update received:', data);

        // If this is a dashboard-related update, refresh dashboard data
        if (data.entityType === 'dashboard' || 
            data.entityType === 'lead' || 
            data.entityType === 'load' || 
            data.entityType === 'invoice') {
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
        }

        // If this is a report-related update, refresh report data
        if (data.entityType === 'report' || 
            data.entityType === 'dispatch' || 
            data.entityType === 'sales') {
          queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
        }
      });

      return () => {
        unsubscribeUiPrefs();
        unsubscribeNotifications();
        unsubscribeDataUpdates();
      };
    }
  }, [user, isConnected, subscribe, dispatch]);

  // The legacy socket system - keep it for now during transition
  useEffect(() => {
    if (socket) {
      socket.on('uiPrefsUpdated', (prefs) => {
        dispatch(setPreferences(prefs));
      });

      return () => {
        socket.off('uiPrefsUpdated');
      };
    }
  }, [socket, dispatch]);

  return <Router />;
}

export default App;