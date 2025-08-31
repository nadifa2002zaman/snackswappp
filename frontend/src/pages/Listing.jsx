import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../lib/auth";
import MessageSellerButton from "../components/MessageSellerButton.jsx";
import ReviewsPreview from "../components/ReviewsPreview.jsx";

/** Build a public URL for images.
 *  - If already absolute (http/https), return as-is
 *  - If starts with /uploads or uploads, prefix the backend origin (5001)
 */
const API_BASE = import.meta.env.VITE_API_URL || ""; // e.g., http://localhost:5001/api
const FILES_BASE = API_BASE.replace(/\/api\/?$/, ""); // -> http://localhost:5001
function toPublicUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads") || url.startsWith("uploads")) {
    return `${FILES_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url; // unknown format, return as-is
}

async function handleReport(id) {
  try {
    const reason =
      window.prompt("Why are you reporting this listing?") || "reported";
    await api.post("/reports", { listingId: id, reason });
    alert("Reported!");
  } catch (e) {
    alert(e?.response?.data?.error || e.message);
  }
}

function OfferBox({ listingId }) {
  const { isAuthenticated } = useAuth();
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  if (!isAuthenticated) return null;

  async function sendOffer() {
    setErr("");
    try {
      await api.post("/offers", { listingId, note });
      setSent(true);
      setNote("");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Failed to send offer");
    }
  }

  return (
    <div className="mt-2 p-2 border rounded">
      <div className="text-sm mb-1">Send a request/offer</div>
      <textarea
        className="w-full border p-2 rounded text-sm"
        placeholder="Add a note (optional)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        onClick={sendOffer}
        className="mt-2 px-3 py-1 rounded bg-indigo-600 text-white"
      >
        Send Offer
      </button>
      {sent && <div className="text-green-600 text-sm mt-1">Offer sent!</div>}
      {err && <div className="text-red-600 text-sm mt-1">{err}</div>}
    </div>
  );
}

export default function Listings() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // filters
  const [q, setQ] = useState("");
  const [tags, setTags] = useState("");
  const [allergies, setAllergies] = useState("");

  const [mine, setMine] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/listings", {
        params: {
          q: q || undefined,
          tags: tags || undefined, // csv (e.g., "vegan,sweet")
          allergies: allergies || undefined, // csv (e.g., "nuts,gluten")
          mine: mine || undefined, // true/false
        },
      });
      setItems(data?.data || []);
    } catch (e) {
      setErr(
        e?.response?.data?.error || e?.message || "Failed to fetch listings"
      );
    } finally {
      setLoading(false);
    }
  }

  // Load once on mount
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-5xl font-bold text-slate-300 mb-8">Snack Listings</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="block text-sm">Search</label>
          <input
            className="border px-2 py-1 rounded"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="pizza, brownie…"
          />
        </div>

        <div>
          <label className="block text-sm">Tags (csv)</label>
          <input
            className="border px-2 py-1 rounded"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="vegan,sweet"
          />
        </div>

        <div>
          <label className="block text-sm">Allergies (csv)</label>
          <input
            className="border px-2 py-1 rounded"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="nuts,gluten"
          />
        </div>

        

        <button
          onClick={load}
          className="px-3 py-1 rounded bg-indigo-600 text-white"
        >
          Apply
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !err && items.length === 0 && <p>No snacks yet.</p>}

      {/* Listings grid (two cards per row on md+) */}
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((it) => {
          // Normalize owner whether it's an id string or a populated user object
          const owner =
            it && typeof it.ownerId === "object" && it.ownerId
              ? it.ownerId
              : { _id: it.ownerId };

          const toList = (v) =>
            Array.isArray(v)
              ? v
              : typeof v === "string"
              ? v
                  .split(/[,|\n]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];

          const tagList = toList(it.tags);
          const allergyList = toList(it.allergies);

          const ratingAvgNum = Number(owner?.ratingAvg ?? 0);
          const ratingText = Number.isFinite(ratingAvgNum)
            ? ratingAvgNum.toFixed(1)
            : "0.0";
          const ratingCount = owner?.ratingCount ?? 0;

          const src = toPublicUrl(
            it.imageUrl || it.image || (it.images && it.images[0]) || ""
          );

          return (
  <div key={it._id} className="rounded-xl border border-white/10 bg-white/5 p-4 mb-10">
    {/* Force two columns: 260px for image, rest for details */}
    <div
      className="gap-4 items-start"
      style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}
    >
      {/* LEFT: image (fixed width) */}
      <div style={{ width: 260 }}>
        {src && (
          <img
            src={src}
            alt={it.title || "listing"}
            className="w-full h-56 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>

      {/* RIGHT: details/actions fill remaining space */}
      <div className="text-slate-200">
        <h3 className="text-xl font-semibold">{it.title || "Untitled"}</h3>
        {it.description && (
          <p className="mt-1 text-slate-400">{it.description}</p>
        )}

        <div className="mt-2 text-sm text-slate-400">
          {owner?.name || "Seller"} · ⭐ {ratingText} ({ratingCount})
        </div>

        {owner?._id && (
          <div className="mt-1">
            <ReviewsPreview userId={owner._id} />
          </div>
        )}

        <div className="mt-3 text-sm text-slate-400 space-y-1">
          <div>
            <span className="font-medium text-slate-300">Tags:</span>{" "}
            {tagList.length ? tagList.join(", ") : "—"}
          </div>
          <div>
            <span className="font-medium text-slate-300">Allergies:</span>{" "}
            {allergyList.length ? allergyList.join(", ") : "none"}
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={() => handleReport(it._id)}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15
                       border border-white/10 text-xs font-semibold"
          >
            Report
          </button>
        </div>

        <div className="mt-3 mb-4">
          <MessageSellerButton listing={it} />
        </div>
        <p className="text-sm text-slate-500">
          Qty: {it.quantity ?? 1}

        </p>
        <div className="mt-4">
          <div className="text-sm text-slate-400 mb-1"></div>
          <OfferBox listingId={it._id} />
        </div>


 
          
      </div>
    </div>
  </div>
);

        })}
      </div>
    </div>
  );
}
