import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import App from "./App";

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

createRoot(document.getElementById("root")!).render(
  <App />
);
