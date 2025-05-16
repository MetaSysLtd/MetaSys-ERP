import { ReactNode, useState, useEffect } from "react";
import SimpleSidebar from "./SimpleSidebar";
import { Header } from "./Header";
import { X, Loader2 } from "lucide-react";
import { NotificationContainer } from "./NotificationContainer";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPage } from "@/components/ui/AnimatedPage";
import { AppLayoutSkeleton } from "@/components/ui/skeleton";
import { SkipLink } from "@/components/ui/skip-link";

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
  const [layoutReady, setLayoutReady] = useState(false);
  
  // Load the layout frame quickly
  useEffect(() => {
    // Mark layout as ready after a very short delay to ensure skeleton shows first
    const timer = setTimeout(() => {
      setLayoutReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle mobile sidebar closing when menu item is clicked
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };
  
  // Handle sidebar collapse toggling and store preference
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };
  
  // Show skeleton UI during initial load for better perceived performance
  if (!layoutReady) {
    return <AppLayoutSkeleton />;
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Skip link for keyboard navigation accessibility */}
      <SkipLink href="#main-content" />
      
      {/* Mobile sidebar - with sliding animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 flex z-40 md:hidden" 
            role="dialog" 
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Sidebar backdrop */}
            <motion.div 
              className="fixed inset-0 bg-[#0a1825]/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
              onClick={handleCloseSidebar}
            />
            
            {/* Sidebar */}
            <motion.div 
              className="relative flex-1 flex flex-col max-w-xs w-full"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
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
            </motion.div>
            
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Desktop sidebar - with width animation */}
      <div className="hidden md:flex md:flex-shrink-0">
        <motion.div 
          className="flex flex-col"
          animate={{ width: sidebarCollapsed ? '5rem' : '18rem' }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <SimpleSidebar 
            mobile={false} 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={handleSidebarCollapse}
          />
        </motion.div>
      </div>
      
      {/* Persistent sidebar toggle button - with fade animation */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.div 
            className="hidden md:block fixed left-3 top-4 z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={(e) => {
                e.preventDefault();
                handleSidebarCollapse(false);
              }}
              className="p-2 rounded-md bg-white shadow-lg hover:bg-[#F2A71B]/20 text-[#025E73] transition-all border border-[#F2A71B]/30"
              title="Expand sidebar"
              aria-label="Expand sidebar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content - with layout shift animation */}
      <motion.div 
        className="flex flex-col w-0 flex-1 overflow-hidden"
        animate={{ marginLeft: sidebarCollapsed ? '0rem' : '0rem' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main 
          id="main-content" 
          className="flex-1 relative overflow-y-auto focus:outline-none bg-white dark:bg-gray-900"
          tabIndex={-1} // Allows the element to receive focus when skipped to
        >
          <div className="px-4 py-6">
            <NotificationContainer />
            <AnimatedPage>
              {children}
            </AnimatedPage>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
