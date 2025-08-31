import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // OPTION B: do NOT call /me on mount unless a token exists
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // We have a token; consider the user logged in even if /me doesn't exist.
    setUser((u) => u ?? {}); // placeholder user object

    // Optional: try /me, but ignore 404 (route not implemented)
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.data) setUser(data.data);
      } catch (e) {
        if (e?.response?.status !== 404) {
          console.warn("auth.me error:", e?.message || e);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loginWithToken(token) {
    localStorage.setItem("token", token);
    // Mark as logged in immediately
    setUser((u) => u ?? {});

    // Optional: try to hydrate user, ignore 404
    try {
      const { data } = await api.get("/auth/me");
      if (data?.data) setUser(data.data);
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.warn("auth.me after login error:", e?.message || e);
      }
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    loginWithToken,
    logout,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
