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
  DollarSign,
  Calendar
} from "lucide-react";
import { useCallback, useState } from "react";
import { Logo } from '@/components/ui/logo';
import { motion, AnimatePresence } from "framer-motion";

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
    // Special case for the dashboard - only highlight when exactly at "/"
    if (route === "/") {
      return location === "/";
    }
    // For other routes, check if the current location matches exactly
    return route === location;
  }, [location]);

  const isParentActive = useCallback((parentRoute: string) => {
    // Skip parent activation logic for the dashboard
    if (parentRoute === "/") return false;
    
    // For other routes, check if location starts with the parent route but isn't exactly the parent route
    return location.startsWith(parentRoute) && location !== parentRoute;
  }, [location]);
  
  // Stable loading state - prevent endless loops by using static content
  if (!user || !role) {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-to-b from-white to-gray-100 text-gray-800 relative overflow-hidden">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-white/30"></div>
        
        {/* Content container */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Static header without dynamic queries */}
          <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-gray-200">
            <Logo />
          </div>
          
          {/* Static loading content */}
          <div className="flex flex-col items-center justify-center flex-1 px-4">
            <div className="bg-white/50 rounded-lg p-6 shadow-sm max-w-xs w-full">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#025E73] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-600 font-medium text-center">Initializing workspace...</p>
              </div>
            </div>
          </div>
          
          {/* Static version info */}
          <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-600 text-center bg-white/30">
            MetaSys ERP v1.0
          </div>
        </div>
      </div>
    );
  }

  // CRM Sub-items
  const crmSubItems = [
    { name: "Dashboard", href: "/crm" },
    { name: "Leads", href: "/crm/leads" },
    { name: "Accounts", href: "/crm/accounts" },
    { name: "Clients", href: "/crm/clients" },
    { name: "Activities", href: "/crm/activities" },
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
    { name: "Policies", href: "/hr/policies" }
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
    { name: "Time Off", href: "/time-off", icon: Calendar },
    { 
      name: "Human Resources", 
      href: "/hr", 
      icon: HeartPulse,
      subItems: hrSubItems,
    },
    { name: "Finance", href: "/finance", icon: Banknote },
    { name: "Marketing", href: "/marketing", icon: Megaphone },
    { name: "Client Portal", href: "/client-portal", icon: Building2 },
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
      <motion.div
        key={item.href}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Link 
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
      </motion.div>
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

    const handleNavigation = (e: React.MouseEvent) => {
      if (!hasSubItems) {
        if (mobile && onMenuItemClick) {
          onMenuItemClick();
        }
      }
    };
    
    return (
      <motion.div 
        key={item.href} 
        className="mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.2,
          delay: 0.05 * (parseInt(item.href.split('/')[1] || '0') || 0) // Slight delay based on item position
        }}
      >
        {/* Main navigation item */}
        {hasSubItems ? (
          <motion.div 
            onClick={handleClick}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer
              ${isActive || isChildActive
                ? 'bg-[#025E73] text-white hover:bg-[#025E73]/90'
                : 'text-gray-800 bg-white/40 hover:bg-[#025E73]/20 hover:text-[#025E73]'
              }
            `}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <item.icon className={`h-[18px] w-[18px] ${(isActive || isChildActive) ? 'text-white' : 'text-[#025E73]'}`} />
            
            {(!collapsed || mobile) && (
              <>
                <span className="flex-1">{item.name}</span>
                {hasSubItems && (
                  <motion.div 
                    className="ml-auto"
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isExpanded 
                      ? <ChevronDown className={`w-4 h-4 ${(isActive || isChildActive) ? 'text-white' : ''}`} />
                      : <ChevronRight className={`w-4 h-4 ${(isActive || isChildActive) ? 'text-white' : ''}`} />
                    }
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href={item.href}
              onClick={handleNavigation}
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
                <span className="flex-1">{item.name}</span>
              )}
            </Link>
          </motion.div>
        )}
        
        {/* Sub-items - with AnimatePresence for entering/exiting */}
        <AnimatePresence>
          {hasSubItems && isExpanded && (!collapsed || mobile) && (
            <motion.div 
              className="mt-1 space-y-1 py-1"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {item.subItems?.map(subItem => renderSubNavItem(subItem, item.href))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
        <motion.div 
          className={`${!collapsed || mobile ? 'px-6' : 'px-4'} py-5 border-b border-gray-200 ${collapsed && !mobile ? 'text-center' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className={`${!collapsed || mobile ? 'flex items-center' : 'flex flex-col items-center'}`}
            animate={{ 
              flexDirection: (!collapsed || mobile) ? 'row' : 'column'
            }}
            transition={{ duration: 0.3 }}
          >
            {user.profileImageUrl ? (
              <motion.img 
                src={user.profileImageUrl} 
                alt={`${user.firstName} ${user.lastName}`}
                className="h-10 w-10 rounded-full border-2 border-[#2170dd]"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <motion.div 
                className="bg-[#025E73] rounded-full h-10 w-10 flex items-center justify-center text-lg font-medium border-2 border-[#F2A71B] text-white"
                whileHover={{ scale: 1.1, borderColor: '#fff' }}
                transition={{ duration: 0.2 }}
              >
                {getInitials(user.firstName, user.lastName)}
              </motion.div>
            )}
            <AnimatePresence>
              {(!collapsed || mobile) && (
                <motion.div 
                  className="ml-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-[#025E73] font-medium">
                    {role.name}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

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

          {/* Admin section - always visible */}
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

          {/* Logout button */}
          <motion.div 
            className="px-4 py-4 mt-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 rounded-md px-3 py-2.5 text-gray-800 font-medium transition-all bg-white/50 hover:bg-[#025E73] hover:text-white"
              whileHover={{ 
                scale: 1.03,
                boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                backgroundColor: "#025E73", 
                color: "#ffffff"
              }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <LogOut className="h-[18px] w-[18px]" />
              </motion.div>
              <AnimatePresence>
                {(!collapsed || mobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </nav>

        {/* Version info */}
        <motion.div 
          className="px-5 py-3 border-t border-gray-200 text-xs text-gray-600 text-center bg-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.5)" }}
        >
          <AnimatePresence mode="wait">
            {!collapsed || mobile ? (
              <motion.span
                key="full-version"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                MetaSys ERP v1.0
              </motion.span>
            ) : (
              <motion.span
                key="short-version"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                v1.0
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}