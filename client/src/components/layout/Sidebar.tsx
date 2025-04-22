import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, getDepartmentColor } from "@/lib/utils";
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
  Layers,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  HeartPulse,
  BriefcaseBusiness,
  UserRound,
  CalendarClock,
  BrainCircuit,
  Megaphone,
  BarChart,
  MessageSquareText
} from "lucide-react";

// Import the Metio logo and icon
import metioIcon from "@/assets/metio-icon.svg";
import metioLogo from "@/assets/metio-logo.svg";

interface SidebarProps {
  mobile: boolean;
  collapsed: boolean; // Added collapsed state
}

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip'


export function Sidebar({ mobile, collapsed }: SidebarProps) {
  const [location] = useLocation();
  const { user, role } = useAuth();
  const dispatch = useDispatch();
  const preferences = useSelector((state: RootState) => state.uiPreferences);

  if (!user || !role) {
    return null;
  }

  const isActiveRoute = (route: string) => {
    // Exact match for root
    if (route === "/" && location === "/") return true;
    // Exact match for other routes
    if (route === location) return true;
    return false;
  };

  const isParentActive = (parentRoute: string) => {
    // Check if any child route is active
    return location.startsWith(parentRoute) && location !== parentRoute;
  };

  const mainNavItems = [
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
        {
          name: "All Leads",
          href: "/crm",
        },
        {
          name: "SQL",
          href: "/crm?status=qualified",
        },
        {
          name: "MQL",
          href: "/crm?status=nurture",
        },
        {
          name: "Clients",
          href: "/crm?status=active",
        },
      ],
    },
    {
      name: "Dispatch",
      href: "/dispatch",
      icon: Truck,
      showFor: ["dispatch", "admin"],
      subItems: [
        {
          name: "Loads",
          href: "/dispatch",
        },
        {
          name: "Clients",
          href: "/dispatch/clients",
        },
        {
          name: "New Load",
          href: "/dispatch/loads/new",
        },
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

  const taskItems = [
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
  ];

  const secondaryNavItems = [
    {
      name: "Time Tracking",
      href: "/time-tracking",
      icon: Clock,
    },
    {
      name: "Human Resources",
      href: "/hr",
      icon: HeartPulse,
      showFor: ["hr", "admin"],
    },
    {
      name: "Finance",
      href: "/finance",
      icon: Banknote,
      showFor: ["finance", "admin"],
      minLevel: 3,
    },
    {
      name: "Marketing",
      href: "/marketing",
      icon: Megaphone,
      showFor: ["marketing", "admin"],
      minLevel: 2,
    },
    {
      name: "Client Portal",
      href: "/client-portal",
      icon: Building2,
      showFor: ["sales", "dispatch", "admin"],
      minLevel: 3,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart2,
      showFor: ["sales", "dispatch", "finance", "hr", "admin"],
      minLevel: 2,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const filterItems = (items: typeof mainNavItems) => {
    return items.filter(item => {
      // Check if the item is restricted to certain departments
      if (item.showFor && !item.showFor.includes(role.department)) {
        return false;
      }

      // Check if the item requires a minimum role level
      if (item.minLevel && role.level < item.minLevel) {
        return false;
      }

      return true;
    });
  };

  const filteredMainItems = filterItems(mainNavItems);
  const filteredSecondaryItems = filterItems(secondaryNavItems);
  const filteredTaskItems = filterItems(taskItems);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.href = "/auth";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleLinkClick = () => {
    if (mobile) {
      dispatch(setPreferences({ ...preferences, sidebarCollapsed: true }));
    }
  };

  // Handle window resize for mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        dispatch(setPreferences({ ...preferences, sidebarCollapsed: true }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size

    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch, preferences]);

  // Colors based on metasysltd.com
  // Primary blue: #0a1825
  // Accent blue: #2170dd
  // Lighter accent: #3f8cff
  // Text color: #f5f9fc

  return (
    <div className="flex flex-col h-full bg-[#0a1825] text-[#f5f9fc]">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 flex items-center border-b border-[#0c1f33]">
        <div className="flex items-center">
          <img src={metioIcon} alt="Metio" className="h-9 w-9" />
          <span className="ml-3 text-xl font-bold tracking-wide">Metio</span>
        </div>
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
                    {collapsed && window.innerWidth >= 992 ? (
                      <TooltipProvider>
                        <Tooltip delayDuration={0} openDelay={200}>
                          <TooltipTrigger>
                            <item.icon className="h-[18px] w-[18px]" />
                          </TooltipTrigger>
                          <TooltipContent>{item.name}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <>
                        <item.icon className="h-[18px] w-[18px]" />
                        <span>{item.name}</span>
                        {(item.subItems && item.subItems.length > 0) ? (
                          <ChevronDown className="w-4 h-4 ml-auto" />
                        ) : (
                          isActiveRoute(item.href) && (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          )
                        )}
                      </>
                    )}
                  </div>
                </Link>

                {/* Render submenu items if they exist */}
                {item.subItems && item.subItems.length > 0 && (
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
              <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
                  ${isActiveRoute(item.href) 
                    ? 'bg-[#2170dd] text-white' 
                    : 'text-[#f5f9fc]/99 hover:bg-[#142c42] hover:text-white'}`}
                >
                  {collapsed && window.innerWidth >= 992 ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0} openDelay={200}>
                        <TooltipTrigger>
                          <item.icon className="h-[18px] w-[18px]" />
                        </TooltipTrigger>
                        <TooltipContent>{item.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.name}</span>
                      {isActiveRoute(item.href) && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </>
                  )}
                </div>
              </Link>
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
              <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
                  ${isActiveRoute(item.href) 
                    ? 'bg-[#2170dd] text-white' 
                    : 'text-[#f5f9fc]/90 hover:bg-[#142c42] hover:text-white'}`}
                >
                  {collapsed && window.innerWidth >= 992 ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0} openDelay={200}>
                        <TooltipTrigger>
                          <item.icon className="h-[18px] w-[18px]" />
                        </TooltipTrigger>
                        <TooltipContent>{item.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.name}</span>
                      {isActiveRoute(item.href) && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </>
                  )}
                </div>
              </Link>
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
              <Link href="/admin" onClick={handleLinkClick}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
                  ${isActiveRoute('/admin') 
                    ? 'bg-[#2170dd] text-white' 
                    : 'text-[#f5f9fc]/90 hover:bg-[#142c42] hover:text-white'}`}
                >
                  {collapsed && window.innerWidth >= 992 ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0} openDelay={200}>
                        <TooltipTrigger>
                          <ShieldAlert className="h-[18px] w-[18px]" />
                        </TooltipTrigger>
                        <TooltipContent>Admin Dashboard</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <>
                      <ShieldAlert className="h-[18px] w-[18px]" />
                      <span>Admin Dashboard</span>
                      {isActiveRoute('/admin') && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </>
                  )}
                </div>
              </Link>
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
              <Link href="/teams/sales" onClick={handleLinkClick}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[#f5f9fc]/90 hover:bg-[#142c42] hover:text-white transition-all">
                  {collapsed && window.innerWidth >= 992 ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0} openDelay={200}>
                        <TooltipTrigger>
                          <Users className="h-[18px] w-[18px]" />
                        </TooltipTrigger>
                        <TooltipContent>Sales</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <>
                      <Users className="h-[18px] w-[18px]" />
                      <span>Sales</span>
                    </>
                  )}
                </div>
              </Link>
              <Link href="/teams/dispatch" onClick={handleLinkClick}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[#f5f9fc]/90 hover:bg-[#142c42] hover:text-white transition-all">
                  {collapsed && window.innerWidth >= 992 ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={0} openDelay={200}>
                        <TooltipTrigger>
                          <Truck className="h-[18px] w-[18px]" />
                        </TooltipTrigger>
                        <TooltipContent>Dispatch</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <>
                      <Truck className="h-[18px] w-[18px]" />
                      <span>Dispatch</span>
                    </>
                  )}
                </div>
              </Link>
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
        Metio ERP v1.0
      </div>
    </div>
  );
}