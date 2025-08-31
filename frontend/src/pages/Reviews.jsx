import { useEffect, useState } from "react";
import api from "../api/client";

export default function Reviews() {
  const [received, setReceived] = useState([]);
  const [written, setWritten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(()=> {
    (async ()=>{
      try {
        const [a,b] = await Promise.all([
          api.get("/reviews/me/received"),
          api.get("/reviews/me/written"),
        ]);
        setReceived(a.data?.data || []);
        setWritten(b.data?.data || []);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold">Reviews</h1>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Received</h2>
        {received.length === 0 && <div className="text-gray-500">No reviews yet.</div>}
        {received.map(r=>(
          <div key={r._id} className="border rounded p-3 mb-2">
            <div className="font-medium">Rating: {r.rating} ⭐</div>
            <div className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleString()}</div>
            {r.comment && <div className="mt-1">{r.comment}</div>}
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Written by me</h2>
        {written.length === 0 && <div className="text-gray-500">No reviews written.</div>}
        {written.map(r=>(
          <div key={r._id} className="border rounded p-3 mb-2">
            <div className="font-medium">Rating: {r.rating} ⭐</div>
            <div className="text-sm text-gray-600">{new Date(r.createdAt).toLocaleString()}</div>
            {r.comment && <div className="mt-1">{r.comment}</div>}
          </div>
        ))}
      </section>
    </div>
  );
}
