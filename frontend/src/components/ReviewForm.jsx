import { useState } from "react";
import api from "../api/client";

export default function ReviewForm({ revieweeId, listingId, offerId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api.post("/reviews", { revieweeId, listingId, offerId, rating, comment });
      onDone?.();
      setComment("");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex items-center gap-2">
      <select value={rating} onChange={(e)=>setRating(Number(e.target.value))} className="border px-2 py-1 rounded">
        {[5,4,3,2,1].map(v=> <option key={v} value={v}>{v} ⭐</option>)}
      </select>
      <input
        value={comment}
        onChange={(e)=>setComment(e.target.value)}
        placeholder="Add a short comment…"
        className="border px-2 py-1 rounded flex-1"
      />
      <button disabled={busy} className="px-3 py-1 rounded bg-indigo-600 text-white">{busy ? "Sending..." : "Submit"}</button>
      {err && <span className="text-red-600 text-sm">{err}</span>}
    </form>
  );
}
