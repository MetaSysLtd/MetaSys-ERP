import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from 'react-redux';
import { store } from './store/store';
import { queryClient } from "./lib/queryClient";
import { useSocket, SocketProvider } from './hooks/use-socket';
import { LeadNotificationProvider } from './hooks/use-lead-notifications';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPreferences, fetchPreferences } from './store/uiPreferencesSlice';
import { useRealTime } from './hooks/use-real-time';
import { useToast } from '@/hooks/use-toast';
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import ForgotPassword from "@/pages/auth/forgot-password";
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
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { AnimationProvider } from "@/contexts/AnimationContext";
import { OrganizationProvider } from "@/hooks/use-organization";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Import the MetaSys logo
import metaSysLogo from "@/assets/logos/MetaSys.png";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

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

  // Fix for proper routing by using Wouter's Route instead of window.location
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/login">
        <Login />
      </Route>
      <Route path="/login">
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
  const { user } = useAuth();
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