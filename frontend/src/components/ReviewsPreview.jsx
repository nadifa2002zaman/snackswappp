import { useEffect, useState } from "react";
import api from "../api/client";

export default function ReviewsPreview({ userId, limit = 2 }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!userId) return;              // guard
    let ok = true;
    (async () => {
      try {
        const { data } = await api.get(`/reviews/user/${userId}`);
        if (ok) setRows((data?.data || []).slice(0, limit));
      } catch (e) {
        if (ok) setErr(e?.response?.data?.error || e.message);
      }
    })();
    return () => { ok = false; };
  }, [userId, limit]);

  if (err || rows.length === 0) return null;

  return (
    <div className="mt-2 text-sm">
      <div className="font-medium">Recent reviews</div>
      {rows.map(r => (
        <div key={r._id} className="text-gray-700">
          <span>⭐ {r.rating}</span>
          {r.comment ? <span className="ml-2">“{r.comment}”</span> : null}
        </div>
      ))}
    </div>
  );
}
