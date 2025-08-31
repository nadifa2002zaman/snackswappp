import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../lib/auth";

export default function Threads() {
  const { user } = useAuth();
  const meId = user?._id ? String(user._id) : "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/threads/mine");
      setItems(data?.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Messages</h1>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && items.length === 0 && <p>No conversations yet.</p>}

      <div className="space-y-3">
        {items.map((t) => {
          // who to label: prefer listing owner (seller); fallback to “other participant”
          const parts = t.participants || t.participant || [];
          const seller = t.listingId?.ownerId || null;
          const other = parts.find((p) => p && String(p._id) !== meId) || null;

          const label =
            seller
              ? [seller.name, seller.email].filter(Boolean).join(" (") +
                (seller.name && seller.email ? ")" : "")
              : other
              ? [other.name, other.email].filter(Boolean).join(" (") +
                (other.name && other.email ? ")" : "")
              : "User";

          return (
            <Link
              key={t._id}
              to={`/threads/${t._id}`}
              className="block p-4 rounded-xl border hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {t.listingId?.imageUrl && (
                  <img
                    src={t.listingId.imageUrl}
                    alt=""
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {label} • {t.listingId?.title || "Listing"}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {t.lastMsgSnippet || "No messages yet"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t.lastMsgAt ? new Date(t.lastMsgAt).toLocaleString() : ""}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
