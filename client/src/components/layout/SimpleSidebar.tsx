import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { 
  HomeIcon, 
  Users, 
  Truck, 
  FileText, 
  BarChart2, 
  Settings,
  Clock,
  Banknote,
  Building2,
  LogOut,
  CheckSquare,
  Bell,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  HeartPulse,
  Megaphone,
  Loader2
} from "lucide-react";
import { useCallback } from "react";
import { Logo } from '@/components/ui/logo';

interface SidebarProps {
  mobile: boolean;
  collapsed: boolean;
  onMenuItemClick?: () => void;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  showFor?: string[];
  minLevel?: number;
  subItems?: Array<{
    name: string;
    href: string;
  }>;
};

export default function SimpleSidebar({ mobile, collapsed, onMenuItemClick }: SidebarProps) {
  const [location] = useLocation();
  const { user, role } = useAuth();
  
  // All hook calls must be before any conditional returns
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);
  
  // Simple pure functions for determining active states
  const isActiveRoute = useCallback((route: string) => {
    if (route === "/" && location === "/") return true;
    if (route === location) return true;
    return false;
  }, [location]);

  const isParentActive = useCallback((parentRoute: string) => {
    return location.startsWith(parentRoute) && location !== parentRoute;
  }, [location]);
  
  // If user or role is not available yet, show loading state
  if (!user || !role) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-white to-gray-100">
        <Loader2 className="h-8 w-8 text-[#025E73] animate-spin mb-4" />
        <p className="text-sm text-gray-600">Loading user data...</p>
      </div>
    );
  }

  // Navigation items definition
  const mainNavItems = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Sales", href: "/sales", icon: Users },
    { name: "Dispatch", href: "/dispatch", icon: Truck },
    { name: "Invoices", href: "/invoices", icon: FileText },
  ];

  const taskItems = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const secondaryNavItems = [
    { name: "Time Tracking", href: "/time-tracking", icon: Clock },
    { name: "Human Resources", href: "/hr", icon: HeartPulse },
    { name: "Finance", href: "/finance", icon: Banknote },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Filter items based on user role
  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (item.showFor && !item.showFor.includes(role.department)) return false;
      if (item.minLevel && role.level < item.minLevel) return false;
      return true;
    });
  };

  // Render a navigation item with auto-collapse on mobile
  const renderNavItem = (item: NavItem) => {
    const handleClick = () => {
      if (mobile && onMenuItemClick) {
        onMenuItemClick();
      }
    };
    
    return (
      <Link key={item.href} href={item.href} onClick={handleClick}>
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
          ${isActiveRoute(item.href)
            ? 'bg-[#025E73] text-white hover:bg-[#025E73]/90'
            : isParentActive(item.href)
              ? 'bg-[#F2A71B] text-white'
              : 'text-gray-800 bg-white/40 hover:bg-[#025E73]/20 hover:text-[#025E73]'}`}>
          <item.icon className={`h-[18px] w-[18px] ${isActiveRoute(item.href) ? 'text-white' : 'text-[#025E73]'}`} />
          {!collapsed || window.innerWidth < 992 ? (
            <>
              <span>{item.name}</span>
              {isActiveRoute(item.href) && <ChevronRight className="w-4 h-4 ml-auto" />}
            </>
          ) : null}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-100 text-gray-800 relative overflow-hidden">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/30"></div>
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 pt-6 pb-5 flex items-center border-b border-gray-200">
          <Logo />
        </div>

        {/* User profile */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} 
                   alt={`${user.firstName} ${user.lastName}`}
                   className="h-10 w-10 rounded-full border-2 border-[#2170dd]" />
            ) : (
              <div className="bg-[#025E73] rounded-full h-10 w-10 flex items-center justify-center text-lg font-medium border-2 border-[#F2A71B] text-white">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[#025E73] font-medium">
                {role.name}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="pt-5 flex-1 overflow-y-auto">
          {/* Main navigation section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
              Main
            </h3>
            <div className="space-y-1">
              {mainNavItems.map(renderNavItem)}
            </div>
          </div>

          {/* Tasks section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
              Tasks
            </h3>
            <div className="space-y-1">
              {taskItems.map(renderNavItem)}
            </div>
          </div>

          {/* Secondary navigation section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
              Management
            </h3>
            <div className="space-y-1">
              {secondaryNavItems.map(renderNavItem)}
            </div>
          </div>

          {/* Admin section */}
          {role.department === "admin" && role.level >= 5 && (
            <div className="px-4 mb-6 pt-4">
              <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
                Administration
              </h3>
              <div className="space-y-1">
                {renderNavItem({
                  name: "Admin Dashboard",
                  href: "/admin",
                  icon: ShieldAlert
                })}
              </div>
            </div>
          )}

          {/* Logout button */}
          <div className="px-4 py-4 mt-auto">
            <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-gray-800 font-medium transition-all bg-white/50 hover:bg-[#025E73] hover:text-white">
              <LogOut className="h-[18px] w-[18px]" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* Version info */}
        <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-600 text-center bg-white/30">
          MetaSys ERP v1.0
        </div>
      </div>
    </div>
  );
}