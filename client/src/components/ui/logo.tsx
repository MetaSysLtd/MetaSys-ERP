import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function Logo() {
  const { user, role, isAuthenticated } = useAuth();
  
  // Determine the appropriate dashboard path based on user role
  const getDashboardPath = () => {
    if (!isAuthenticated || !user) return "/auth"; // Not logged in, go to auth page
    
    // Default dashboard is the main dashboard
    let dashboardPath = "/";
    
    // Redirect based on role
    if (role) {
      // Admin users go to admin dashboard
      if (role.department === "admin" && role.level >= 5) {
        dashboardPath = "/admin";
      } 
      // Sales users go to CRM
      else if (role.department === "sales") {
        dashboardPath = "/crm";
      }
      // Dispatch users go to dispatch
      else if (role.department === "dispatch") {
        dashboardPath = "/dispatch";
      }
    }
    
    return dashboardPath;
  };
  
  return (
    <Link href={getDashboardPath()}>
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="text-2xl font-bold bg-gradient-to-r from-[#025E73] to-[#412754] bg-clip-text text-transparent">
          Meta<span className="text-[#F2A71B]">Sys</span>
        </div>
        <div className="text-sm font-medium text-[#025E73] px-1.5 py-0.5 bg-[#F2A71B]/10 rounded">ERP</div>
      </div>
    </Link>
  );
}