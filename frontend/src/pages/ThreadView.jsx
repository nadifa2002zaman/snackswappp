import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../lib/auth";


export default function ThreadView() {
  // Read the :id param and rename it to avoid shadowing
  const { id: threadId } = useParams();

  const { user } = useAuth();
  const meId = user?._id ? String(user._id) : "";

  const [meta, setMeta] = useState(null);   // participants + listing (+owner)
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const bottomRef = useRef(null);

  const badId = !threadId || threadId === "undefined";

  async function loadMeta() {
    const { data } = await api.get(`/threads/${threadId}`);
    setMeta(data?.data || null);
  }

  async function loadMessages() {
    const { data } = await api.get(`/threads/${threadId}/messages`);
    const fresh = data?.data || [];
    setMsgs(prev => {
      const seen = new Map(prev.map(m => [String(m._id), m]));
      for (const m of fresh) seen.set(String(m._id), m);
      return [...seen.values()].sort(
        (a, b) => new Date(a.createdAt || a.sentAt) - new Date(b.createdAt || b.sentAt)
      );
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  useEffect(() => {
    let alive = true;

    // Reset when switching threads
    setMsgs([]);
    setErr("");
    setLoading(true);

    // Guard: don't call the API with an invalid id
    if (badId) {
      setErr("Bad thread id");
      setLoading(false);
      return () => {};
    }

    (async () => {
      try {
        await Promise.all([loadMeta(), loadMessages()]);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.error || e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const t = setInterval(() => alive && loadMessages(), 4000);
    const onFocus = () => alive && loadMessages();
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [threadId, badId]); // re-run if URL changes

  async function send(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (badId) {
      alert("Bad thread id");
      return;
    }

    try {
      const { data } = await api.post(`/threads/${threadId}/messages`, { content });
      setText("");

      const saved = data?.data;
      setMsgs(prev => [
        ...prev,
        {
          _id: saved?._id || `tmp-${Date.now()}`,
          threadId,
          senderId: { _id: user?._id, name: user?.name, email: user?.email },
          content,
          createdAt: saved?.createdAt || new Date().toISOString(),
        },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);

      // sync from server (pull in other user's messages too)
      loadMessages();
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  const parts = meta?.participants || meta?.participantIds || [];
  const other = parts.find(p => p && String(p._id) !== meId) || null;
  const otherLabel = other
    ? [other.name, other.email].filter(Boolean).join(" (") + (other.name && other.email ? ")" : "")
    : "User";

  const seller = meta?.listingId?.ownerId || null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/threads" className="text-indigo-600">
          &larr; Back
        </Link>
      </div>

      <h1 className="text-3xl font-bold">Conversation with {otherLabel}</h1>
      {seller && (
        <div className="text-sm text-gray-500">
          Seller: {[seller.name, seller.email].filter(Boolean).join(" (")}
          {seller.name && seller.email ? ")" : ""}
        </div>
      )}
      {meta?.listingId?.title && (
        <div className="text-sm text-gray-500">Listing: {meta.listingId.title}</div>
      )}

      {loading && <p className="mt-3">Loading…</p>}
      {err && <p className="mt-3 text-red-600">{err}</p>}

      <div className="mt-3 h-[60vh] overflow-y-auto border rounded-xl p-4 bg-white">
        {msgs.map(m => {
          const sid = m.senderId?._id || m.senderId;
          const mine = meId && String(sid) === meId;
          const name = mine ? "You" : (m.senderId?.name || m.senderId?.email || "User");
          const email = mine ? user?.email : m.senderId?.email;
          const when = new Date(m.createdAt || m.sentAt).toLocaleString();

          return (
            <div key={m._id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-lg ${mine ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>
                <div className="text-xs opacity-75 mb-1">
                  {name}{email ? ` • ${email}` : ""} • {when}
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Send</button>
      </form>
    </div>
  );
}
