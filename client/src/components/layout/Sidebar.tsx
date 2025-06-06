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
  Trophy,
  Bug,
  Palette
} from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { setPreferences, syncToggleDropdown, toggleDropdown } from '@/store/uiPreferencesSlice';
import React, { useEffect, useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Logo } from '@/components/ui/logo';
import { useMeasure, useMouse, useWindowSize } from 'react-use';

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(
    () => window.matchMedia(query).matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

// Import the store and gradient background
import { store } from '@/store/store';
import gradientBgPath from "@/assets/backgrounds/gradient-bg.png";

// NavItemComponent for items that need their own click handlers
const NavItemComponent = ({ item }: { item: NavItem }) => {
  const [location] = useLocation();

  const isActiveRoute = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route === location) return true;
    return false;
  };

  const isParentActive = (parentRoute: string) => {
    return location.startsWith(parentRoute) && location !== parentRoute;
  };

  return (
    <Link href={item.href}>
      <div 
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
          ${isActiveRoute(item.href)
            ? 'bg-[#025E73] text-white hover:bg-[#025E73]/90'
            : isParentActive(item.href)
              ? 'bg-[#F2A71B] text-white'
              : 'text-gray-800 bg-white/40 hover:bg-[#025E73]/20 hover:text-[#025E73]'}`}
      >
        <item.icon className={`h-[18px] w-[18px] ${isActiveRoute(item.href) || isParentActive(item.href) ? 'text-[#025E73]' : 'text-gray-500'}`} />
        <span>{item.name}</span>
        {isActiveRoute(item.href) && (
          <ChevronRight className="w-4 h-4 ml-auto" />
        )}
      </div>
    </Link>
  );
};

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
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Initialize the expandedDropdown state from localStorage on first render
  useEffect(() => {
    try {
      const savedDropdown = localStorage.getItem('metasys_expanded_dropdown');
      if (savedDropdown) {
        dispatch(setPreferences({ expandedDropdown: savedDropdown }));
      }
    } catch (error) {
      console.error('Failed to load dropdown state from localStorage:', error);
    }
  }, [dispatch]);

  // Define helper functions
  const isActiveRoute = useCallback((route: string) => {
    if (route === "/" && location === "/") return true;
    if (route !== "/" && route === location) return true;
    if (route !== "/" && location.startsWith(route + "/")) return true;
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
  if (!user) {
    return null;
  }

  // Use fallback role if role is not loaded yet
  const effectiveRole = role || { name: 'User', level: 1 };

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
      subItems: [
        { name: "Leads", href: "/crm" },
        { name: "Accounts", href: "/crm/accounts" },
        { name: "Activities", href: "/crm/activities" },
        { name: "Surveys", href: "/crm/surveys" },
        { name: "Commissions", href: "/crm/commissions" },
      ],
    },
    {
      name: "Dispatch",
      href: "/dispatch",
      icon: Truck,
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
    },
  ];

  const taskItems: NavItem[] = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const secondaryNavItems: NavItem[] = [
    { name: "Time Tracking", href: "/time-tracking", icon: Clock },
    { name: "Human Resources", href: "/hr", icon: HeartPulse },
    { name: "Finance", href: "/finance", icon: Banknote },
    { name: "Marketing", href: "/marketing", icon: Megaphone },
    { name: "Client Portal", href: "/client-portal", icon: Building2 },
    { name: "Gamification", href: "/gamification", icon: Trophy },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Design System", href: "/design-system", icon: Palette },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Handle dropdown menu toggle
  const handleDropdownToggle = useCallback((name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleDropdown(name));

    // Save to localStorage
    try {
      const currentExpanded = preferences.expandedDropdown === name ? null : name;
      localStorage.setItem('metasys_expanded_dropdown', currentExpanded || '');
    } catch (error) {
      console.error('Failed to save dropdown state to localStorage:', error);
    }
  }, [dispatch, preferences.expandedDropdown]);

  // Navigation item renderer function (not a React component with hooks)
  const renderNavItem = (item: NavItem, isMain = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = preferences.expandedDropdown === item.name;

    // Determine if any children are active
    const hasActiveChild = hasSubItems && item.subItems?.some(subItem => 
      location === subItem.href || 
      (subItem.href.includes('?') && location.includes(subItem.href.split('?')[0]))
    );

    return (
      <div key={item.href}>
        {hasSubItems ? (
          // For items with dropdown menus
          <div>
            <div 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all relative nav-item
                ${isActiveRoute(item.href)
                  ? 'bg-[#F2A71B]/20 text-[#025E73] font-semibold relative before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[70%] before:w-1 before:bg-[#FFDD57] before:rounded-r'
                  : isParentActive(item.href) || hasActiveChild
                    ? 'bg-[#F2A71B]/10 text-[#025E73] font-semibold relative before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[70%] before:w-1 before:bg-[#FFDD57] before:rounded-r'
                    : 'text-gray-800 bg-white/40 hover:bg-[#F2A71B]/10 hover:text-[#025E73] hover:relative hover:before:content-[""] hover:before:absolute hover:before:left-0 hover:before:top-1/2 hover:before:-translate-y-1/2 hover:before:h-[70%] hover:before:w-1 hover:before:bg-[#FFDD57] hover:before:rounded-r hover:before:opacity-50'}`}
              onClick={(e) => handleDropdownToggle(item.name, e)}
            >
              <item.icon className={`h-[18px] w-[18px] nav-icon ${isActiveRoute(item.href) || isParentActive(item.href) || hasActiveChild ? 'text-[#025E73]' : 'text-gray-600'}`} />
              {!collapsed || window.innerWidth < 992 ? (
                <>
                  <span className={`nav-item-text ${isActiveRoute(item.href) || isParentActive(item.href) || hasActiveChild ? 'font-semibold' : ''}`}>{item.name}</span>
                  <ChevronDown 
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </>
              ) : null}
              {collapsed && (
                <div className="tooltip hidden">{item.name}</div>
              )}
            </div>

            {/* Dropdown menu with animation */}
            <div 
              className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
              style={{
                maxHeight: isExpanded ? '500px' : '0px',
              }}
            >
              <div className="mt-1 ml-7 space-y-1 py-1 bg-[#012F3E]/10 rounded-md pl-6">
                {item.subItems?.map((subItem) => (
                  <Link key={subItem.href} href={subItem.href} onClick={handleLinkClick}>
                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all
                      ${location === subItem.href || (subItem.href.includes('?') && location.includes(subItem.href.split('?')[0]))
                        ? 'bg-[#F2A71B]/20 text-[#025E73] font-semibold relative pl-3 before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[70%] before:w-1 before:bg-[#FFDD57] before:rounded-r' 
                        : 'text-gray-700 hover:bg-[#F2A71B]/10 hover:text-[#025E73] hover:relative hover:pl-3 hover:before:content-[""] hover:before:absolute hover:before:left-0 hover:before:top-1/2 hover:before:-translate-y-1/2 hover:before:h-[70%] hover:before:w-1 hover:before:bg-[#FFDD57] hover:before:rounded-r hover:before:opacity-50'}`}
                    >
                      <span>{subItem.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // For normal items without dropdown
          <Link href={item.href} onClick={handleLinkClick}>
            <div 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative nav-item
                ${isActiveRoute(item.href)
                  ? 'bg-[#F2A71B]/20 text-[#025E73] font-semibold relative before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[70%] before:w-1 before:bg-[#FFDD57] before:rounded-r'
                  : isParentActive(item.href)
                    ? 'bg-[#F2A71B]/10 text-[#025E73] font-semibold relative before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[70%] before:w-1 before:bg-[#FFDD57] before:rounded-r'
                    : 'text-gray-800 bg-white/40 hover:bg-[#F2A71B]/10 hover:text-[#025E73] hover:relative hover:before:content-[""] hover:before:absolute hover:before:left-0 hover:before:top-1/2 hover:before:-translate-y-1/2 hover:before:h-[70%] hover:before:w-1 hover:before:bg-[#FFDD57] hover:before:rounded-r hover:before:opacity-50'}`}
            >
              <item.icon className={`h-[18px] w-[18px] nav-icon ${isActiveRoute(item.href) || isParentActive(item.href) ? 'text-[#025E73]' : 'text-gray-600'}`} />
              {!collapsed || window.innerWidth < 992 ? (
                <>
                  <span className={`nav-item-text ${isActiveRoute(item.href) || isParentActive(item.href) ? 'font-semibold' : ''}`}>{item.name}</span>
                  {isActiveRoute(item.href) && (
                    <ChevronRight className="w-4 h-4 ml-auto text-[#025E73]" />
                  )}
                </>
              ) : null}
              {collapsed && (
                <div className="tooltip hidden">{item.name}</div>
              )}
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col h-full bg-white text-gray-800 relative overflow-hidden sidebar"
      style={{
        backgroundImage: `url(${gradientBgPath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay for legibility */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>

      {/* Content container (above the overlay) */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 pt-6 pb-5 flex items-center border-b border-gray-200">
          <Logo />
        </div>

        {/* User profile */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            {user.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={`${user.firstName} ${user.lastName}`}
                className="h-10 w-10 rounded-full border-2 border-[#2170dd]"
              />
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
                {typeof effectiveRole === 'object' ? effectiveRole.name : 'User'}
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
              {mainNavItems.map((item) => 
                renderNavItem(item, true)
              )}
            </div>
          </div>

          {/* Tasks section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
              Tasks
            </h3>
            <div className="space-y-1">
              {taskItems.map((item) => (
                renderNavItem(item)
              ))}
            </div>
          </div>

          {/* Secondary navigation section */}
          <div className="px-4 mb-6 pt-4">
            <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
              Management
            </h3>
            <div className="space-y-1">
              {secondaryNavItems.map((item) => (
                renderNavItem(item)
              ))}
            </div>
          </div>

          {/* Admin section - visible only to system admins */}
          {typeof effectiveRole === 'object' && (effectiveRole.level >= 4 || effectiveRole.name === "System Admin") && (
            <div className="px-4 mb-6 pt-4">
              <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
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
                <NavItemComponent 
                  item={{
                    name: "Admin Management",
                    href: "/admin/management",
                    icon: ShieldAlert
                  }} 
                />
                <NavItemComponent 
                  item={{
                    name: "Bug Management",
                    href: "/admin/bugs",
                    icon: Bug
                  }} 
                />
              </div>
            </div>
          )}

          {/* Team switcher - always visible */}
          <div className="px-4 mb-6 pt-4">
            <h3 className="px-2 text-xs font-semibold text-[#F2A71B] uppercase tracking-[.5px] mb-3 pt-1">
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

          {/* Logout button */}
          <div className="px-4 py-4 mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-gray-800 font-medium transition-all bg-white/50 hover:bg-[#025E73] hover:text-white"
            >
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