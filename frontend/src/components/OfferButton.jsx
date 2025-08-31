import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../lib/auth";

/**
 * Usage:
 *   <OfferButton listing={item} />
 * or
 *   <OfferButton listingId={id} title="Burger" />
 */
export default function OfferButton({ listing, listingId, title }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const lId =
    listing?._id || listing?.id || listingId; // support multiple shapes
  const ownerId =
    listing?.ownerId || listing?.owner?._id || listing?.userId || listing?.user?._id;

  // Hide button if no listing id
  if (!lId) return null;

  // Don’t let the owner send an offer to themselves
  if (user?._id && ownerId && String(ownerId) === String(user._id)) {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function submit() {
    if (!user) return navigate("/login");
    setErr("");
    setOk("");
    setSending(true);
    try {
      await api.post("/offers", { listingId: lId, note });
      setOk("Offer sent!");
      setNote("");
      // optional: go to Offers page
      // navigate("/offers");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Failed to send offer");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => (user ? setOpen(true) : navigate("/login"))}
        className="px-3 py-1 rounded bg-amber-600 text-white"
      >
        Make Offer
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 border rounded">
      <div className="text-sm mb-2">
        Send an offer{title ? ` for “${title}”` : ""}.
      </div>
      <textarea
        rows={3}
        placeholder="Add a note (optional)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full border rounded p-2 text-sm"
      />
      {err && <div className="text-red-600 mt-2 text-sm">{err}</div>}
      {ok && <div className="text-green-600 mt-2 text-sm">{ok}</div>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={submit}
          disabled={sending}
          className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send offer"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setNote("");
            setErr("");
            setOk("");
          }}
          className="px-3 py-1 rounded border"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
