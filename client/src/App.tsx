import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from 'react-redux';
import { store } from './store/store';
import { queryClient } from "./lib/queryClient";
import { useSocket, SocketProvider } from './hooks/use-socket';
import { LeadNotificationProvider } from './hooks/use-lead-notifications';
import { useEffect, useState, Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import { setPreferences, fetchPreferences } from './store/uiPreferencesSlice';
import { useRealTime } from './hooks/use-real-time';
import { useToast } from '@/hooks/use-toast';

// Core pages - keep non-lazy for initial load
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import ForgotPassword from "@/pages/auth/forgot-password";
import Dashboard from "@/pages/dashboard";

// Lazy load heavy pages for better performance
// Lazy load CRM modules for better performance
const CRMPage = lazy(() => import("@/pages/crm"));
const LeadDetails = lazy(() => import("@/pages/crm/[id]"));
const CRMLeadsPage = lazy(() => import("@/pages/crm/leads"));
const CRMClientsPage = lazy(() => import("@/pages/crm/clients"));
const CRMCommissionsPage = lazy(() => import("@/pages/crm/commissions"));
const CRMAccountsPage = lazy(() => import("@/pages/crm/accounts"));
const CRMSurveysPage = lazy(() => import("@/pages/crm/surveys"));
const CRMActivitiesPage = lazy(() => import("@/pages/crm/activities"));

// Lazy load Dispatch modules (heavy with charts/reports)
const DispatchPage = lazy(() => import("@/pages/dispatch/index"));
const DispatchClientsPage = lazy(() => import("@/pages/dispatch/clients"));
const DispatchLoadsPage = lazy(() => import("@/pages/dispatch/loads"));
const NewLoadPage = lazy(() => import("@/pages/dispatch/new-load"));
const TrackingPage = lazy(() => import("@/pages/dispatch/tracking"));
const DispatchTasksPage = lazy(() => import("@/pages/dispatch/tasks/index"));
const DispatchReportsPage = lazy(() => import("@/pages/dispatch/reports/index"));
const PerformanceTargetsPage = lazy(() => import("@/pages/dispatch/targets/index"));

// Lazy load Invoice modules (heavy with charts)
const InvoicesPage = lazy(() => import("@/pages/invoices/index"));
const InvoiceDetailsPage = lazy(() => import("@/pages/invoices/[id]"));
// Lazy load other heavy modules
const TasksPage = lazy(() => import("@/pages/tasks/index"));
const TimeTrackingPage = lazy(() => import("@/pages/time-tracking/index"));
const TimeOffPage = lazy(() => import("@/pages/time-off/index"));
const ReportsPage = lazy(() => import("@/pages/reports/index"));
const SettingsPage = lazy(() => import("@/pages/settings/index"));
const ProfilePage = lazy(() => import("@/pages/settings/index"));

// Lazy load Admin modules (heavy with charts and tables)
const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminManagementPage = lazy(() => import("@/pages/admin/management"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AdminRolesPage = lazy(() => import("@/pages/admin/roles"));
const AdminOrganizationsPage = lazy(() => import("@/pages/admin/organizations"));
const AdminCommissionsPage = lazy(() => import("@/pages/admin/commissions"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings"));
const AdminTasksPage = lazy(() => import("@/pages/admin/tasks"));
const AdminReportsPage = lazy(() => import("@/pages/admin/reports"));
const BugsPage = lazy(() => import("@/pages/admin/bugs"));
// Lazy load remaining heavy modules
const HRPage = lazy(() => import("@/pages/hr/index"));
const HRPoliciesPage = lazy(() => import("@/pages/hr/policies"));
const FinancePage = lazy(() => import("@/pages/finance/index"));
const MarketingPage = lazy(() => import("@/pages/marketing/index"));
const NotificationsPage = lazy(() => import("@/pages/notifications/index"));
const GamificationPage = lazy(() => import("@/pages/gamification/index"));
const LeaderboardPage = lazy(() => import("@/pages/leaderboard/index"));
const ClientPortalPage = lazy(() => import("@/pages/client-portal/index"));
const CommissionPoliciesPage = lazy(() => import("@/pages/settings/commission-policies"));
const DesignSystemPage = lazy(() => import("@/pages/design-system"));
// Team pages - lazy load for better performance
const SalesTeamPage = lazy(() => import("@/pages/teams/sales"));
const DispatchTeamPage = lazy(() => import("@/pages/teams/dispatch"));
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { AnimationProvider } from "@/contexts/AnimationContext";
import { OrganizationProvider } from "@/hooks/use-organization";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthBoundary } from "@/components/auth/AuthBoundary";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Import the MetaSys logo
import metaSysLogo from "@/assets/logos/MetaSys.png";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metaSysLogo} alt="MetaSys" className="w-40 mb-4 animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D3557]" />
          <span className="text-[#1D3557] font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    navigate("/auth");
    return null;
  }

  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metaSysLogo} alt="MetaSys" className="w-40 mb-4 animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D3557]" />
          <span className="text-[#1D3557] font-medium">Loading page...</span>
        </div>
      </div>
    }>
      <ErrorBoundary>
        <Component {...rest} />
      </ErrorBoundary>
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <Login />
      </Route>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/auth/login">
        <Login />
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

      <Route path="/dashboard">
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

      <Route path="/crm/leads/:id">
        {(params) => (
          <AppLayout>
            <ProtectedRoute component={LeadDetails} params={params} />
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
            {/* The RealTimeProvider is already added at the root level in main.tsx */}
            <SocketProvider>
              <NotificationProvider>
                <MessageProvider>
                  <AnimationProvider>
                    <OrganizationProvider>
                      <LeadNotificationProvider>
                        <AuthBoundary>
                          <AppContent />
                        </AuthBoundary>
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
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

  // Load UI preferences when user logs in (non-blocking with fallbacks)
  useEffect(() => {
    if (user) {
      // Don't block sidebar rendering - use async pattern with fallbacks
      dispatch(fetchPreferences()).catch((error) => {
        console.warn('UI preferences failed to load, using defaults:', error);
        // Set default preferences so sidebar can render
        dispatch(setPreferences({
          sidebarPinned: true,
          sidebarCollapsed: false,
          expandedDropdown: null,
          animationsEnabled: false,
          transitionSpeed: 'normal',
          pageTransition: 'fade',
          reducedMotion: false
        }));
      });
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