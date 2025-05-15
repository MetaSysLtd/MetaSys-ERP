import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import "./index.css";

// Lazy load the main App component for faster initial loading
const App = lazy(() => import("./App"));

// Initialize global error handlers with console tracking
const originalConsoleError = console.error;
console.error = function(...args: any[]) {
  // Call the original console.error
  originalConsoleError.apply(console, args);
  
  // Log that the global error handler caught this
  console.log("[Global Error]", args[0]);
};

// Initialize global error handling
console.log("Global error handlers initialized");

// Inline minimal loading component for fast initial render
// This appears before any React code loads
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    height: '100vh',
    width: '100vw',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    background: '#F1FAFB'
  }}>
    <div style={{
      width: '120px',
      height: '120px',
      marginBottom: '20px',
      background: 'url(/assets/images/logos/metasys-logo.png) no-repeat center center',
      backgroundSize: 'contain'
    }} />
    <div style={{
      width: '30px',
      height: '30px',
      border: '3px solid #e0e0e0', 
      borderTopColor: '#025E73',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<LoadingScreen />}>
    <App />
  </Suspense>
);
