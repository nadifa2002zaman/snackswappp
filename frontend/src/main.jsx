// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import { UnreadProvider } from "./lib/unread.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <UnreadProvider>
        <App />
      </UnreadProvider>
    </AuthProvider>
  </React.StrictMode>
);
