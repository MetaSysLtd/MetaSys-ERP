import { ReactNode, useState } from "react";
import SimpleSidebar from "./SimpleSidebar";
import { Header } from "./Header";
import { X } from "lucide-react";
import { NotificationContainer } from "./NotificationContainer";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check if there's a stored preference or default to false
    const storedPref = localStorage.getItem('sidebarCollapsed');
    return storedPref ? JSON.parse(storedPref) : false;
  });
  const [location] = useLocation();
  
  // Handle mobile sidebar closing when menu item is clicked
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };
  
  // Handle sidebar collapse toggling and store preference
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? "" : "hidden"}`} 
        role="dialog" 
        aria-modal="true"
      >
        {/* Sidebar backdrop */}
        <div 
          className="fixed inset-0 bg-[#0a1825]/80 backdrop-blur-sm transition-opacity ease-linear duration-300"
          aria-hidden="true"
          onClick={handleCloseSidebar}
        ></div>
        
        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full transform transition ease-in-out duration-300 translate-x-0">
          <div className="absolute top-0 right-0 -mr-12 pt-4">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={handleCloseSidebar}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <SimpleSidebar mobile={true} collapsed={false} onMenuItemClick={handleCloseSidebar} />
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className={`flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-72'} transition-all duration-300`}>
          <SimpleSidebar 
            mobile={false} 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={handleSidebarCollapse}
          />
        </div>
      </div>
      
      {/* Persistent sidebar toggle button - only visible when sidebar is collapsed */}
      {sidebarCollapsed && (
        <div className="hidden md:block fixed left-3 top-4 z-50">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSidebarCollapse(false);
            }}
            className="p-2 rounded-md bg-white shadow-lg hover:bg-[#F2A71B]/20 text-[#025E73] transition-all border border-[#F2A71B]/30"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white dark:bg-gray-900">
          <div className="px-4 py-6">
            <NotificationContainer />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
