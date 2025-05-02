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
  Loader2,
  LucideIcon,
  User,
  ListTodo,
  UserCircle,
  Phone,
  Mail,
  Briefcase,
  Menu,
  DollarSign
} from "lucide-react";
import { useCallback, useState } from "react";
import { Logo } from '@/components/ui/logo';

interface SidebarProps {
  mobile: boolean;
  collapsed: boolean;
  onMenuItemClick?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

type SubNavItem = {
  name: string;
  href: string;
  icon?: React.FC<{ className?: string }>;
};

type NavItem = {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  showFor?: string[];
  minLevel?: number;
  subItems?: SubNavItem[];
  hidden?: boolean; // Optional flag to hide items that are still in development
};

export default function SimpleSidebar({ mobile, collapsed: externalCollapsed, onMenuItemClick, onCollapsedChange }: SidebarProps) {
  const [location] = useLocation();
  const { user, role } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    // Default expanded state based on current location
    '/sales': location.startsWith('/sales'),
    '/dispatch': location.startsWith('/dispatch'),
    '/crm': location.startsWith('/crm'),
    '/hr': location.startsWith('/hr')
  });
  
  // Use external collapsed state (from parent) as the source of truth
  const collapsed = externalCollapsed;
  
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
  
  // Toggle the expansion state of a navigation item
  const toggleExpand = useCallback((href: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedItems(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
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

  // CRM Sub-items
  const crmSubItems = [
    { name: "Leads", href: "/crm/leads" },
    { name: "Clients", href: "/crm/clients" },
    { name: "Commissions", href: "/crm/commissions" }
  ];

  // Dispatch Sub-items
  const dispatchSubItems = [
    { name: "Loads", href: "/dispatch/loads" },
    { name: "Clients", href: "/dispatch/clients" },
    { name: "New Load", href: "/dispatch/new-load" },
    { name: "Load Tracking", href: "/dispatch/tracking" }
  ];

  // HR Sub-items
  const hrSubItems = [
    { name: "Team Members", href: "/hr/team" },
    { name: "Job Postings", href: "/hr/jobs" },
    { name: "Onboarding", href: "/hr/onboarding" },
    { name: "Time Off", href: "/hr/time-off" }
  ];

  // Navigation items definition
  const mainNavItems: NavItem[] = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { 
      name: "CRM", 
      href: "/crm", 
      icon: Users,
      subItems: crmSubItems
    },
    { 
      name: "Dispatch", 
      href: "/dispatch", 
      icon: Truck,
      subItems: dispatchSubItems
    },
    { name: "Invoices", href: "/invoices", icon: FileText },
  ];

  const taskItems = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const secondaryNavItems: NavItem[] = [
    { name: "Time Tracking", href: "/time-tracking", icon: Clock },
    { 
      name: "Human Resources", 
      href: "/hr", 
      icon: HeartPulse,
      subItems: hrSubItems,
      hidden: true // Hide HR module as it's still in development
    },
    { name: "Finance", href: "/finance", icon: Banknote, hidden: true }, // Hide Finance module as it's still in development
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Filter items based on user role and hidden flag
  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (item.hidden) return false;
      if (item.showFor && !item.showFor.includes(role.department)) return false;
      if (item.minLevel && role.level < item.minLevel) return false;
      return true;
    });
  };

  // Render a sub navigation item
  const renderSubNavItem = (item: SubNavItem, parentHref: string) => {
    const isActive = isActiveRoute(item.href);
    
    const handleClick = () => {
      if (mobile && onMenuItemClick) {
        onMenuItemClick();
      }
    };
    
    return (
      <Link 
        key={item.href} 
        href={item.href} 
        onClick={handleClick}
        className={`
          flex items-center gap-2 ml-6 pl-3 py-2 text-sm rounded-md border-l-2 
          ${isActive 
            ? 'border-l-[#F2A71B] text-[#025E73] font-medium bg-white/50' 
            : 'border-l-gray-300 text-gray-600 hover:text-[#025E73] hover:border-l-[#F2A71B]'
          }
        `}
      >
        {item.icon && <item.icon className="h-[14px] w-[14px]" />}
        <span>{item.name}</span>
      </Link>
    );
  };

  // Render a navigation item with auto-collapse on mobile
  const renderNavItem = (item: NavItem) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.href] || false;
    const isActive = isActiveRoute(item.href);
    const isChildActive = isParentActive(item.href);
    
    // Auto-expand if a child is active
    if (isChildActive && !isExpanded && hasSubItems) {
      // Set it to be expanded without re-rendering
      expandedItems[item.href] = true;
    }
    
    const handleClick = (e: React.MouseEvent) => {
      if (hasSubItems) {
        toggleExpand(item.href, e);
      } else if (mobile && onMenuItemClick) {
        onMenuItemClick();
      }
    };
    
    return (
      <div key={item.href} className="mb-1">
        {/* Main navigation item */}
        <div 
          onClick={handleClick}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer
            ${isActive || isChildActive
              ? 'bg-[#025E73] text-white hover:bg-[#025E73]/90'
              : 'text-gray-800 bg-white/40 hover:bg-[#025E73]/20 hover:text-[#025E73]'
            }
          `}
        >
          <item.icon className={`h-[18px] w-[18px] ${(isActive || isChildActive) ? 'text-white' : 'text-[#025E73]'}`} />
          
          {(!collapsed || mobile) && (
            <>
              <span className="flex-1">{item.name}</span>
              {hasSubItems && (
                <div className="ml-auto">
                  {isExpanded 
                    ? <ChevronDown className={`w-4 h-4 ${(isActive || isChildActive) ? 'text-white' : ''}`} />
                    : <ChevronRight className={`w-4 h-4 ${(isActive || isChildActive) ? 'text-white' : ''}`} />
                  }
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Sub-items */}
        {hasSubItems && isExpanded && (!collapsed || mobile) && (
          <div className="mt-1 space-y-1 py-1">
            {item.subItems?.map(subItem => renderSubNavItem(subItem, item.href))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-100 text-gray-800 relative overflow-hidden">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/30"></div>
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo and collapse button */}
        <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-gray-200">
          <Logo />
          {!mobile && !collapsed && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (onCollapsedChange) {
                  onCollapsedChange(true);
                }
              }} 
              className="p-1.5 rounded-md bg-gray-100 hover:bg-[#025E73]/10 text-[#025E73] transition-all"
              title="Collapse sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User profile */}
        <div className={`${!collapsed || mobile ? 'px-6' : 'px-4'} py-5 border-b border-gray-200 ${collapsed && !mobile ? 'text-center' : ''}`}>
          <div className={`${!collapsed || mobile ? 'flex items-center' : 'flex flex-col items-center'}`}>
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} 
                   alt={`${user.firstName} ${user.lastName}`}
                   className="h-10 w-10 rounded-full border-2 border-[#2170dd]" />
            ) : (
              <div className="bg-[#025E73] rounded-full h-10 w-10 flex items-center justify-center text-lg font-medium border-2 border-[#F2A71B] text-white">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            {(!collapsed || mobile) && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[#025E73] font-medium">
                  {role.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="pt-5 flex-1 overflow-y-auto">
          {/* Main navigation section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className={`px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1 ${collapsed && !mobile ? 'text-center' : ''}`}>
              {collapsed && !mobile ? 'Main' : 'Main'}
            </h3>
            <div className="space-y-1">
              {filterItems(mainNavItems).map(renderNavItem)}
            </div>
          </div>

          {/* Tasks section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className={`px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1 ${collapsed && !mobile ? 'text-center' : ''}`}>
              {collapsed && !mobile ? '' : 'Tasks'}
            </h3>
            <div className="space-y-1">
              {filterItems(taskItems).map(renderNavItem)}
            </div>
          </div>

          {/* Secondary navigation section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className={`px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1 ${collapsed && !mobile ? 'text-center' : ''}`}>
              {collapsed && !mobile ? '' : 'Management'}
            </h3>
            <div className="space-y-1">
              {filterItems(secondaryNavItems).map(renderNavItem)}
            </div>
          </div>

          {/* Admin section */}
          {role.department === "admin" && role.level >= 5 && (
            <div className="px-4 mb-6 pt-4">
              <h3 className={`px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1 ${collapsed && !mobile ? 'text-center' : ''}`}>
                {collapsed && !mobile ? '' : 'Administration'}
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
                    className="w-full flex items-center justify-center gap-3 rounded-md px-3 py-2.5 text-gray-800 font-medium transition-all bg-white/50 hover:bg-[#025E73] hover:text-white">
              <LogOut className="h-[18px] w-[18px]" />
              {(!collapsed || mobile) && <span>Logout</span>}
            </button>
          </div>
        </nav>

        {/* Version info */}
        <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-600 text-center bg-white/30">
          {!collapsed || mobile ? 'MetaSys ERP v1.0' : 'v1.0'}
        </div>
      </div>
    </div>
  );
}