import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, getDepartmentColor } from "@/lib/utils";
import { 
  HomeIcon, 
  Users, 
  Truck, 
  FileText, 
  BarChart2, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  mobile: boolean;
}

export function Sidebar({ mobile }: SidebarProps) {
  const [location] = useLocation();
  const { user, role } = useAuth();
  
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
      name: "Reports",
      href: "/reports",
      icon: BarChart2,
      showFor: ["sales", "dispatch", "admin"],
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
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 flex items-center border-b border-gray-700">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="ml-2 text-xl font-semibold">MetaSys ERP</span>
        </div>
      </div>
      
      {/* User profile */}
      <div className="px-4 py-4 border-b border-gray-700">
        <div className="flex items-center">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={`${user.firstName} ${user.lastName}`}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="bg-gray-700 rounded-full h-10 w-10 flex items-center justify-center text-lg font-medium">
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          <div className="ml-3">
            <p className="text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className={`text-xs ${getDepartmentColor(role.department)}`}>
              {role.name}
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="pt-4 flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActiveRoute(item.href)
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActiveRoute(item.href) ? "text-gray-300" : "text-gray-400"
                  }`}
                />
                {item.name}
              </a>
            </Link>
          ))}
        </div>
        
        {/* Team switcher for admin users */}
        {role && role.department === "admin" && (
          <div className="mt-6 px-2">
            <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Teams
            </h3>
            <div className="mt-2 space-y-1">
              <a href="#" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white bg-primary-600">
                Sales
              </a>
              <a href="#" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
                Dispatch
              </a>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
