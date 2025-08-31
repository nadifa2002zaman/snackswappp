import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "./auth";

const Ctx = createContext({ msgs: 0, offers: 0, perThread: {} });

export function UnreadProvider({ children, intervalMs = 10000 }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState({ msgs: 0, offers: 0, perThread: {} });

  async function load() {
    if (!isAuthenticated) {
      setState({ msgs: 0, offers: 0, perThread: {} });
      return;
    }
    try {
      const [tu, ou] = await Promise.all([
        api.get("/threads/unread").catch(() => ({ data: { ok: false } })),
        api.get("/offers/unread").catch(() => ({ data: { ok: false } })),
      ]);

      const msgTotal = tu?.data?.ok ? (tu.data.data?.total || 0) : 0;
      const perThread = tu?.data?.ok ? (tu.data.data?.perThread || {}) : {};
      const offerTotal = ou?.data?.ok ? (ou.data.data?.total || 0) : 0;

      setState({ msgs: msgTotal, offers: offerTotal, perThread });
    } catch {
      // ignore network errors for the badge
    }
  }

  useEffect(() => {
    load(); // initial
    if (!isAuthenticated) return;
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, [isAuthenticated, intervalMs]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useUnread() {
  return useContext(Ctx);
}
