import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Dashboard from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import LeadDetails from "@/pages/leads/[id]";
import DispatchPage from "@/pages/dispatch";
import InvoicesPage from "@/pages/invoices";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AdminDashboard from "@/pages/admin";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Import the Metio logo
import metioIcon from "@/assets/metio-icon.svg";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col bg-[#F1FAFB]">
        <img src={metioIcon} alt="Metio" className="w-16 h-16 mb-4 animate-pulse" />
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#1D3557]" />
          <span className="text-[#1D3557] font-medium">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = "/login";
    return null;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
    <Login />
  </Route>
      
      <Route path="/">
        {() => (
          <AppLayout>
            <ProtectedRoute component={Dashboard} />
          </AppLayout>
        )}
      </Route>
      
      <Route path="/leads">
        {() => (
          <AppLayout>
            <ProtectedRoute component={LeadsPage} />
          </AppLayout>
        )}
      </Route>
      
      <Route path="/leads/:id">
        {(params) => (
          <AppLayout>
            <ProtectedRoute component={LeadDetails} params={params} />
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
      
      <Route path="/invoices">
        {() => (
          <AppLayout>
            <ProtectedRoute component={InvoicesPage} />
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
      
      <Route path="/admin">
        {() => (
          <AppLayout>
            <ProtectedRoute component={AdminDashboard} />
          </AppLayout>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
