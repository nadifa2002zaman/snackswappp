import { useEffect, useState } from "react";
import api from "../api/client";
import ReviewForm from "../components/ReviewForm"; // adjust path if different

export default function Offers() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null); // id:action

  async function fetchList(qs) {
    // Try /offers/mine first; if 404 exists only as /offers, fall back
    try {
      const r1 = await api.get(`/offers/mine${qs}`);
      return Array.isArray(r1?.data?.data) ? r1.data.data : [];
    } catch (e) {
      if (e?.response?.status === 404) {
        const r2 = await api.get(`/offers${qs}`);
        return Array.isArray(r2?.data?.data) ? r2.data.data : [];
      }
      throw e;
    }
  }

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [inc, out] = await Promise.all([
        fetchList("?type=incoming"),
        fetchList("?type=outgoing"),
      ]);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Failed to load offers";
      // If endpoints aren’t wired yet or preflight blocks, show empty quietly
      if (
        e?.response?.status === 404 ||
        /CORS|ERR_FAILED|Network|Failed to fetch/i.test(msg)
      ) {
        setIncoming([]);
        setOutgoing([]);
        setErr("");
      } else if (e?.response?.status === 401) {
        setIncoming([]);
        setOutgoing([]);
        setErr("Please log in to view your offers.");
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id, action) {
    try {
      setBusy(id + ":" + action);
      await api.patch(`/offers/${id}`, { action });
      await load();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Action failed";
      alert(msg);
    } finally {
      setBusy(null);
    }
  }

  function Row({ o, side, onRefresh }) {
    // Normalize common field-name variants
    const listing = o.listing || o.listingId || {};
    const listingId =
         o.listing?._id || o.listingId?._id || o.listingId;
    const listingOwnerId =
         o.listing?.ownerId?._id ||
         o.listingId?.ownerId?._id ||
         o.ownerId; // fallback if your API includes it

    const senderId =
         o.offeredBy?._id || o.user?._id || o.sender?._id || o.fromId;

    const revieweeId = side === "incoming" ? senderId : listingOwnerId;





    const from = o.offeredBy || o.user || o.sender || {};
    const name = from.name || from.email || "User";

    return (
      <div key={o._id} className="border rounded p-3 mb-3">
        <div className="font-medium">
          {listing.title || "Listing"} — <span className="uppercase">{o.status}</span>
        </div>
        {side === "incoming" && (
          <div className="text-sm text-gray-600">From: {name}</div>
        )}
        {o.note && <div className="mt-1 text-sm italic">“{o.note}”</div>}

        {o.status === "pending" && side === "incoming" && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => act(o._id, "accept")}
              disabled={busy === o._id + ":accept"}
              className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
            >
              {busy === o._id + ":accept" ? "Accepting…" : "Accept"}
            </button>
            <button
              onClick={() => act(o._id, "reject")}
              disabled={busy === o._id + ":reject"}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              {busy === o._id + ":reject" ? "Rejecting…" : "Reject"}
            </button>
          </div>
        )}

        {o.status === "pending" && side === "outgoing" && (
          <div className="mt-2">
            <button
              onClick={() => act(o._id, "cancel")}
              disabled={busy === o._id + ":cancel"}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              {busy === o._id + ":cancel" ? "Cancelling…" : "Cancel"}
            </button>
          </div>
        
        )}
        {o.status === "accepted" && revieweeId && listingId && (
          <div className="mt-3">
            <ReviewForm
              revieweeId={revieweeId}
              listingId={listingId}
              offerId={o._id}
              onDone={() => onRefresh?.()}
            />
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">Offers</h1>
      {err && <div className="text-red-600 mb-3">{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-medium mb-2">Incoming (to your listings)</h2>
            {incoming.length === 0 && (
              <div className="text-sm text-gray-500">No incoming offers.</div>
            )}
            {incoming.map((o) => (
              <Row key={o._id} o={o} side="incoming" onRefresh={load} />
            ))}
          </div>

          <div>
            <h2 className="text-xl font-medium mb-2">Outgoing (you sent)</h2>
            {outgoing.length === 0 && (
              <div className="text-sm text-gray-500">No outgoing offers.</div>
            )}
            {outgoing.map((o) => (
              <Row key={o._id} o={o} side="outgoing" onRefresh={load} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
