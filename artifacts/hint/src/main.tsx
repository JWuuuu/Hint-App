import { createRoot } from "react-dom/client";
import App from "./App";
import { configureApiClient } from "./lib/api";
import { configureMobileRuntime } from "./lib/mobile/runtime";
import "./index.css";

configureMobileRuntime();
configureApiClient();

createRoot(document.getElementById("root")!).render(<App />);
