import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Search, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User, 
  Calendar, 
  HelpCircle,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/notification/NotificationDropdown";
import { MessageDropdown } from "@/components/message/MessageDropdown";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    toast({
      title: "Search",
      description: `Searching for: ${searchQuery}`,
    });
  };

  return (
    <header className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        className="md:hidden px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-600 dark:focus:text-gray-300"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex-1 px-4 flex justify-between">
        {/* Search */}
        <div className="flex-1 flex items-center">
          <form className="w-full max-w-lg lg:max-w-xs" onSubmit={handleSearch}>
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative text-gray-400 focus-within:text-gray-600 dark:focus-within:text-gray-300">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2170dd] dark:focus:ring-[#3f8cff] focus:border-transparent sm:text-sm"
                placeholder="Search leads, loads, invoices..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* Right side items */}
        <div className="ml-4 flex items-center space-x-4">
          {/* Help button */}
          <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="sr-only">Get help</span>
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Calendar button */}
          <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="sr-only">View calendar</span>
            <Calendar className="h-5 w-5" />
          </button>

          {/* Messages Dropdown */}
          <MessageDropdown />
          
          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* Profile dropdown */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2170dd] dark:focus:ring-[#3f8cff]">
                <span className="sr-only">Open user menu</span>
                <div className="flex items-center">
                  {user?.profileImageUrl ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                      src={user.profileImageUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                  ) : (
                    <div className="bg-[#2170dd] rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium text-white border-2 border-white dark:border-gray-800">
                      {user ? getInitials(user.firstName, user.lastName) : ""}
                    </div>
                  )}
                  <span className="hidden lg:block ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="hidden lg:block ml-1 h-4 w-4 text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings/preferences")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}