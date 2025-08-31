// backend/routes/offers.js
import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Offer from "../models/offer.js";
import Listing from "../models/listing.js";

const router = express.Router();


/* utilities */
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));

/**
 * GET /api/offers/mine?type=incoming|outgoing
 * - incoming: offers made to listings I own (ownerId === me)
 * - outgoing: offers I sent (offeredBy === me)
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const me = req.user.id || req.user._id;
    const type = (req.query.type || "incoming").toLowerCase();

    let filter;
    if (type === "outgoing") {
      filter = { offeredBy: me };
    } else if (type === "incoming") {
      filter = { ownerId: me };
    } else {
      // optional: return both, but your frontend calls once per type
      filter = { $or: [{ ownerId: me }, { offeredBy: me }] };
    }

    const items = await Offer.find(filter)
      .sort({ createdAt: -1 })
      .populate("listingId", "title imageUrl")
      .populate("offeredBy", "name email")
      .lean();

    res.json({ data: items });
  } catch (e) {
    console.error("GET /offers/mine error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/offers
 * body: { listingId, note }
 * Creates a pending offer to a listing (not to your own).
 */
router.post("/", auth, async (req, res) => {
  try {
    let { listingId, note = "" } = req.body || {};
    note = String(note || "").slice(0, 1000);
    if (!isObjectId(listingId)) {
      return res.status(400).json({ error: "Invalid listingId" });
    }

    const listing = await Listing.findById(listingId).lean();
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const me = req.user.id || req.user._id;
    if (String(listing.ownerId) === String(me)) {
      return res.status(400).json({ error: "You cannot offer on your own listing" });
    }

    // prevent duplicate pending offers by the same user to the same listing
    const already = await Offer.findOne({
      listingId,
      offeredBy: me,
      status: "pending",
    }).lean();
    if (already) {
      return res.status(400).json({ error: "You already have a pending offer for this listing" });
    }

    const offer = await Offer.create({
      listingId,
      ownerId: listing.ownerId,
      offeredBy: me,
      note,
    });

    const populated = await Offer.findById(offer._id)
      .populate("listingId", "title imageUrl")
      .populate("offeredBy", "name email");

    res.json({ data: populated });
  } catch (e) {
    console.error("POST /offers error:", e);
    res.status(500).json({ error: "Failed to create offer" });
  }
});

/**
 * PATCH /api/offers/:id
 * body: { action: "accept" | "reject" | "cancel" }
 * - accept/reject: only listing owner can do this
 * - cancel: only offer sender can do this
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid offer id" });

    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    if (offer.status !== "pending") {
      return res.status(400).json({ error: "Only pending offers can be modified" });
    }

   const me = String(req.user.id || req.user._id);

    if (action === "accept" || action === "reject") {
      if (String(offer.ownerId) !== me) {
        return res.status(403).json({ error: "Only the listing owner can perform this action" });
      }
      offer.status = action === "accept" ? "accepted" : "rejected";

      // optional: mark listing as reserved on accept
      if (action === "accept") {
        await Listing.findByIdAndUpdate(offer.listingId, { status: "reserved" });
      }
    } else if (action === "cancel") {
      if (String(offer.offeredBy) !== me) {
        return res.status(403).json({ error: "Only the sender can cancel this offer" });
      }
      offer.status = "canceled";
    } else {
      return res.status(400).json({ error: "Unknown action" });
    }

    await offer.save();

    const populated = await Offer.findById(offer._id)
      .populate("listingId", "title imageUrl")
      .populate("offeredBy", "name email");

    res.json({ data: populated });
  } catch (e) {
    console.error("PATCH /offers/:id error:", e);
    res.status(500).json({ error: "Failed to update offer" });
  }
});



// ADD this route
router.get("/unread", auth, async (req, res) => {
  try {
    const me = String(req.user.id);

    // Unread = pending offers where I'm the seller (i.e., buyer requested)
    // If you also support seller counter-offers, duplicate the query for buyerId: me.
    const pendingForMe = await Offer.countDocuments({
      sellerId: me,
      status: "pending",
    });

    res.json({ ok: true, data: { total: pendingForMe } });
  } catch (e) {
    console.error("GET /offers/unread", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


export default router;
