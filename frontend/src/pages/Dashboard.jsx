import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    api.get("/listings/mine")
      .then(({ data }) => on && setMine(data?.data || []))
      .catch((e) => on && setErr(e?.response?.data?.error || "Failed to load"));
    return () => { on = false; };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl font-bold text-slate-800">Dashboard</h1>
        <Link to="/create" className="px-4 py-2 rounded bg-indigo-600 text-white">Create</Link>
      </div>

      {user && (
        <div className="rounded-xl border p-4 mb-6">
          <p className="text-lg">Welcome, {user.name} 🎉</p>
          <p className="text-slate-600">Email: {user.email}</p>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-2">Your listings</h2>
      {err && <p className="text-red-600">{err}</p>}
      {mine.length === 0 && !err && <p>No items yet.</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {mine.map((it) => (
          <div key={it._id} className="rounded border p-3">
            {it.imageUrl && <img src={it.imageUrl} className="w-full h-40 object-cover rounded" />}
            <h3 className="mt-2 font-semibold">{it.title}</h3>
            <p className="text-sm text-slate-500">Qty: {it.quantity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
