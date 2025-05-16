import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { RealTimeProvider } from "./contexts/RealTimeContext";

// Initialize global error handlers with console tracking
const originalConsoleError = console.error;
console.error = function() {
  // Call the original console.error
  originalConsoleError.apply(console, arguments);
  
  // Log that the global error handler caught this
  console.log("[Global Error]", arguments[0]);
};

// Initialize global error handling
console.log("Global error handlers initialized");

createRoot(document.getElementById("root")!).render(
  <RealTimeProvider>
    <App />
  </RealTimeProvider>
);
