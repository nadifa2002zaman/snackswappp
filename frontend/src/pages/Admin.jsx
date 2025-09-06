import { useEffect, useState } from "react";
import api from "../api/client";


export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);

  async function load() {
    const s = await api.get("/admin/dashboard");
    setSummary(s.data?.data);
    const l = await api.get("/admin/listings?onlyReported=true");
    setItems(l.data?.data || []);
  }

  useEffect(() => { load(); }, []);

  async function act(id, op) {
    const url = op === "hide" ? `/admin/listings/${id}/hide`
      : op === "unhide" ? `/admin/listings/${id}/unhide`
      : `/admin/listings/${id}`;
    const method = op === "delete" ? "delete" : "patch";
    await api[method](url);
    await load();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Admin Moderation</h1>

      {summary && (
        <div className="mb-6 text-sm text-slate-600">
          Total listings: {summary.totalListings} • Hidden: {summary.hiddenListings} • Reported≥3: {summary.reportedOver3} • Users: {summary.totalUsers}
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-3">Reported listings</h2>
      {!items.length && <p className="text-slate-500">No reports 🎉</p>}

      <div className="space-y-6">
        {items.map((it) => (
          <div key={it._id} className="border rounded-lg p-4">
            <div className="flex gap-4">
              {it.imageUrl && <img src={it.imageUrl} alt="" className="w-32 h-32 object-cover rounded" />}
              <div>
                <div className="font-semibold">{it.title}</div>
                <div className="text-sm text-slate-600">Reported: {it.reportedCount} • Hidden: {it.isHidden ? "Yes" : "No"}</div>
                <div className="mt-2 flex gap-2">
                  {!it.isHidden && <button onClick={() => act(it._id, "hide")} className="px-3 py-1 rounded bg-yellow-100">Hide</button>}
                  {it.isHidden && <button onClick={() => act(it._id, "unhide")} className="px-3 py-1 rounded bg-green-100">Unhide</button>}
                  <button onClick={() => act(it._id, "delete")} className="px-3 py-1 rounded bg-red-100">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
