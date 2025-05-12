
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function Logo() {
  const { user, role, isAuthenticated } = useAuth();
  
  // Determine the appropriate dashboard path based on user role
  const getDashboardPath = () => {
    if (!isAuthenticated || !user) return "/auth";

    // Admin users with level 5+ go to admin dashboard
    if (role?.department === "admin" && role.level >= 5) {
      return "/admin";
    }
    
    // Department-specific dashboards
    switch (role?.department) {
      case "sales":
        return "/crm";
      case "dispatch":
        return "/dispatch";
      case "finance":
        return "/finance";
      case "hr":
        return "/hr";
      case "marketing":
        return "/marketing";
      default:
        return "/"; // Default dashboard
    }
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
