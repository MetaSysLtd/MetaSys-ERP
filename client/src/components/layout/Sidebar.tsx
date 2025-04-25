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
  Megaphone
} from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { setPreferences } from '@/store/uiPreferencesSlice';
import { useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from '@/components/ui/logo';

// Import the store where it's defined
import { store } from '@/store/store';

type RootState = ReturnType<typeof store.getState>;

interface SidebarProps {
  mobile: boolean;
  collapsed: boolean;
}

// Define NavItem type
type SubItem = {
  name: string;
  href: string;
};

type NavItem = {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
  showFor?: string[];
  minLevel?: number;
  subItems?: SubItem[];
};

export function Sidebar({ mobile, collapsed }: SidebarProps) {
  const [location] = useLocation();
  const { user, role } = useAuth();
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.uiPreferences);
  
  // Define helper functions
  const isActiveRoute = useCallback((route: string) => {
    if (route === "/" && location === "/") return true;
    if (route === location) return true;
    return false;
  }, [location]);

  const isParentActive = useCallback((parentRoute: string) => {
    return location.startsWith(parentRoute) && location !== parentRoute;
  }, [location]);
  
  // Handle window resize for mobile breakpoint
  const handleResize = useCallback(() => {
    if (window.innerWidth < 768) {
      dispatch(setPreferences({ ...preferences, sidebarCollapsed: true }));
    }
  }, [dispatch, preferences]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.href = "/auth";
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  const handleLinkClick = useCallback(() => {
    if (mobile) {
      dispatch(setPreferences({ ...preferences, sidebarCollapsed: true }));
    }
  }, [mobile, dispatch, preferences]);

  // Return early if user not authenticated
  if (!user || !role) {
    return null;
  }

  // Define navigation items
  const mainNavItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: HomeIcon,
    },
    {
      name: "CRM",
      href: "/crm",
      icon: Users,
      showFor: ["sales", "admin"],
      subItems: [
        { name: "All Leads", href: "/crm" },
        { name: "SQL", href: "/crm?status=qualified" },
        { name: "MQL", href: "/crm?status=nurture" },
        { name: "Clients", href: "/crm?status=active" },
      ],
    },
    {
      name: "Dispatch",
      href: "/dispatch",
      icon: Truck,
      showFor: ["dispatch", "admin"],
      subItems: [
        { name: "Loads", href: "/dispatch" },
        { name: "Clients", href: "/dispatch/clients" },
        { name: "New Load", href: "/dispatch/loads/new" },
        { name: "Daily Tasks", href: "/dispatch/tasks" },
        { name: "Performance", href: "/dispatch/reports" },
      ],
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: FileText,
      showFor: ["sales", "dispatch", "admin"],
      minLevel: 2,
    },
  ];

  const taskItems: NavItem[] = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const secondaryNavItems: NavItem[] = [
    { name: "Time Tracking", href: "/time-tracking", icon: Clock },
    { name: "Human Resources", href: "/hr", icon: HeartPulse, showFor: ["hr", "admin"] },
    { name: "Finance", href: "/finance", icon: Banknote, showFor: ["finance", "admin"], minLevel: 3 },
    { name: "Marketing", href: "/marketing", icon: Megaphone, showFor: ["marketing", "admin"], minLevel: 2 },
    { name: "Client Portal", href: "/client-portal", icon: Building2, showFor: ["sales", "dispatch", "admin"], minLevel: 3 },
    { name: "Reports", href: "/reports", icon: BarChart2, showFor: ["sales", "dispatch", "finance", "hr", "admin"], minLevel: 2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Filter items based on user role
  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (item.showFor && !item.showFor.includes(role.department)) {
        return false;
      }
      if (item.minLevel && role.level < item.minLevel) {
        return false;
      }
      return true;
    });
  };

  const filteredMainItems = filterItems(mainNavItems);
  const filteredSecondaryItems = filterItems(secondaryNavItems);
  const filteredTaskItems = filterItems(taskItems);

  // Navigation item component
  const NavItemComponent = ({ item, isMain = false }: { item: NavItem, isMain?: boolean }) => (
    <div key={item.href}>
      <Link href={item.href} onClick={handleLinkClick}>
        <div 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
            ${isActiveRoute(item.href)
              ? 'bg-[#457B9D] text-white hover:bg-[#2EC4B6]'
              : isParentActive(item.href)
                ? 'bg-[#1D3557] text-white'
                : 'text-[#f5f9fc]/90 hover:bg-[#142c42] hover:text-white'}`}
        >
          <item.icon className="h-[18px] w-[18px]" />
          {!collapsed || window.innerWidth < 992 ? (
            <>
              <span>{item.name}</span>
              {(item.subItems && item.subItems.length > 0) ? (
                <ChevronDown className="w-4 h-4 ml-auto" />
              ) : (
                isActiveRoute(item.href) && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )
              )}
            </>
          ) : null}
        </div>
      </Link>

      {/* Render submenu items if they exist */}
      {isMain && item.subItems && item.subItems.length > 0 && (
        <div className="mt-1 ml-7 space-y-1">
          {item.subItems.map((subItem) => (
            <Link key={subItem.href} href={subItem.href} onClick={handleLinkClick}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all
                ${location === subItem.href || (subItem.href.includes('?') && location.includes(subItem.href.split('?')[0]))
                  ? 'bg-[#2170dd]/80 text-white' 
                  : 'text-[#f5f9fc]/80 hover:bg-[#142c42] hover:text-white'}`}
              >
                <span>{subItem.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a1825] text-[#f5f9fc]">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 flex items-center border-b border-[#0c1f33]">
        <Logo />
      </div>

      {/* User profile */}
      <div className="px-6 py-5 border-b border-[#0c1f33]">
        <div className="flex items-center">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={`${user.firstName} ${user.lastName}`}
              className="h-10 w-10 rounded-full border-2 border-[#2170dd]"
            />
          ) : (
            <div className="bg-[#0c1f33] rounded-full h-10 w-10 flex items-center justify-center text-lg font-medium border-2 border-[#3f8cff]">
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-[#3f8cff] font-medium">
              {role.name}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="pt-5 flex-1 overflow-y-auto">
        {/* Main navigation section */}
        <div className="px-4 mb-6">
          <h3 className="px-2 text-xs font-semibold text-[#5a7a9a] uppercase tracking-wider mb-3">
            Main
          </h3>
          <div className="space-y-1">
            {filteredMainItems.map((item) => (
              <NavItemComponent key={item.href} item={item} isMain={true} />
            ))}
          </div>
        </div>

        {/* Tasks section */}
        <div className="px-4 mb-6">
          <h3 className="px-2 text-xs font-semibold text-[#5a7a9a] uppercase tracking-wider mb-3">
            Tasks
          </h3>
          <div className="space-y-1">
            {filteredTaskItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Secondary navigation section */}
        <div className="px-4 mb-6">
          <h3 className="px-2 text-xs font-semibold text-[#5a7a9a] uppercase tracking-wider mb-3">
            Management
          </h3>
          <div className="space-y-1">
            {filteredSecondaryItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Admin section */}
        {role && role.department === "admin" && role.level >= 5 && (
          <div className="px-4 mb-6">
            <h3 className="px-2 text-xs font-semibold text-[#5a7a9a] uppercase tracking-wider mb-3">
              Administration
            </h3>
            <div className="space-y-1">
              <NavItemComponent 
                item={{
                  name: "Admin Dashboard",
                  href: "/admin",
                  icon: ShieldAlert
                }} 
              />
            </div>
          </div>
        )}

        {/* Team switcher for admin users */}
        {role && role.department === "admin" && (
          <div className="px-4 mb-6">
            <h3 className="px-2 text-xs font-semibold text-[#5a7a9a] uppercase tracking-wider mb-3">
              Teams
            </h3>
            <div className="space-y-1">
              <NavItemComponent 
                item={{
                  name: "Sales",
                  href: "/teams/sales",
                  icon: Users
                }} 
              />
              <NavItemComponent 
                item={{
                  name: "Dispatch",
                  href: "/teams/dispatch",
                  icon: Truck
                }} 
              />
            </div>
          </div>
        )}

        {/* Logout button */}
        <div className="px-4 py-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-[#f5f9fc]/90 text-sm font-medium transition-all hover:text-white hover:bg-[#142c42]"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Version info */}
      <div className="px-5 py-3 border-t border-[#0c1f33] text-xs text-[#5a7a9a] text-center">
        MetaSys ERP v1.0
      </div>
    </div>
  );
}