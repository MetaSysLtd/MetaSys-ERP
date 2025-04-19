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
  LogOut
} from "lucide-react";

// Import the Metio logo and icon
import metioIcon from "@/assets/metio-icon.svg";
import metioLogo from "@/assets/metio-logo.svg";

interface SidebarProps {
  mobile: boolean;
}

export function Sidebar({ mobile }: SidebarProps) {
  const [location] = useLocation();
  const { user, role, logout } = useAuth();
  
  if (!user || !role) {
    return null;
  }
  
  const isActiveRoute = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route !== "/" && location.startsWith(route)) return true;
    return false;
  };
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: HomeIcon,
    },
    {
      name: "Leads",
      href: "/leads",
      icon: Users,
      showFor: ["sales", "admin"],
    },
    {
      name: "Dispatch",
      href: "/dispatch",
      icon: Truck,
      showFor: ["dispatch", "admin"],
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: FileText,
      showFor: ["sales", "dispatch", "admin"],
      minLevel: 2,
    },
    {
      name: "Time Tracking",
      href: "/time-tracking",
      icon: Clock,
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
  
  const filteredNavItems = navItems.filter(item => {
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

  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1D3557] text-white">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 flex items-center border-b border-[#457B9D]/30">
        <div className="flex items-center">
          <img src={metioIcon} alt="Metio" className="h-9 w-9" />
          <span className="ml-3 text-xl font-semibold">Metio ERP</span>
        </div>
      </div>
      
      {/* User profile */}
      <div className="px-5 py-4 border-b border-[#457B9D]/30">
        <div className="flex items-center">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={`${user.firstName} ${user.lastName}`}
              className="h-10 w-10 rounded-full border-2 border-[#2EC4B6]"
            />
          ) : (
            <div className="bg-[#457B9D] rounded-full h-10 w-10 flex items-center justify-center text-lg font-medium border-2 border-[#2EC4B6]">
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-[#2EC4B6] font-medium">
              {role.name}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="pt-4 flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`sidebar-link ${isActiveRoute(item.href) ? 'active' : ''}`}>
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Team switcher for admin users */}
        {role && role.department === "admin" && (
          <div className="mt-6 px-3">
            <h3 className="px-2 text-xs font-semibold text-[#FFDD57] uppercase tracking-wider">
              Teams
            </h3>
            <div className="mt-2 space-y-1">
              <Link href="/teams/sales">
                <div className="sidebar-link">
                  <Users className="h-5 w-5" />
                  <span>Sales</span>
                </div>
              </Link>
              <Link href="/teams/dispatch">
                <div className="sidebar-link">
                  <Truck className="h-5 w-5" />
                  <span>Dispatch</span>
                </div>
              </Link>
            </div>
          </div>
        )}
        
        {/* Logout button */}
        <div className="px-3 py-4 mt-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:text-white hover:bg-[#1A2A47]"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
      
      {/* Version info */}
      <div className="px-5 py-2 text-xs text-[#457B9D]/70 text-center">
        Metio ERP v1.0
      </div>
    </div>
  );
}
