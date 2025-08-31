// frontend/src/components/MessageSellerButton.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function MessageSellerButton({ listing }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function startChat() {
    if (!listing?._id || busy) return;
    setBusy(true);
    try {
      // Server returns { ok, data: thread }
      const { data } = await api.post("/threads/start", { listingId: listing._id });

      const threadId =
        data?.data?._id ||        // preferred shape
        data?.threadId ||         // tolerate alt shapes
        data?.thread?._id;

      if (!threadId) throw new Error("Thread id missing in server response");

      navigate(`/threads/${threadId}`);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || "Failed to open chat";
      alert(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startChat}
      disabled={busy}
      className={`px-3 py-1.5 rounded-full bg-indigo-600 text-white font-medium
                  hover:bg-indigo-700 active:translate-y-px transition
                  ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {busy ? "Opening…" : "Message seller"}
    </button>
  );
}
