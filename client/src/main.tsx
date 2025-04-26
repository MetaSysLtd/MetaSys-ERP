import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { RealTimeProvider } from "./contexts/RealTimeContext";

createRoot(document.getElementById("root")!).render(
  <RealTimeProvider>
    <App />
  </RealTimeProvider>
);
