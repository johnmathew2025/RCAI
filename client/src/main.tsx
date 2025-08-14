import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { startVersionWatcher } from "@/lib/version-watch";

// Start version watcher to prevent stale cache issues
startVersionWatcher();

createRoot(document.getElementById("root")!).render(<App />);
