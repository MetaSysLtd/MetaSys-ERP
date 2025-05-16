import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/sidebar-enhancements.css"; // Import sidebar enhancements CSS
import { RealTimeProvider } from "./contexts/RealTimeContext";

// Initialize global error handlers with console tracking
const originalConsoleError = console.error;
console.error = function(...args: any[]) {
  // Call the original console.error with spread arguments
  originalConsoleError(...args);
  
  // Log that the global error handler caught this
  console.log("[Global Error]", args[0]);
};

// Initialize global error handling
console.log("Global error handlers initialized");

createRoot(document.getElementById("root")!).render(
  <RealTimeProvider>
    <App />
  </RealTimeProvider>
);
