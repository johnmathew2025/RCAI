import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { BASENAME } from '@/config/routes';
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={BASENAME}>
    <App />
  </BrowserRouter>
);
