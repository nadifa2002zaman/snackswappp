// backend/routes/threads.js
import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import Thread from "../models/thread.js";
import Message from "../models/message.js";
import Listing from "../models/listing.js";

const router = express.Router();

/** -----------------------------------------------------------------------
 * Helper: migrate a legacy thread to always have `participants` populated.
 * Supports:
 *   - New    : t.participants (Array<ObjectId>|Array<string>)
 *   - Old    : t.participantsIds (Array<ObjectId>|Array<string>)
 *   - Legacy : t.buyerId / t.sellerId (ObjectId|string)
 * ---------------------------------------------------------------------- */
async function migrateParticipantsIfNeeded(thread) {
  if (!thread) return thread;

  const hasNew =
    Array.isArray(thread.participants) && thread.participants.length > 0;
  const hasOld =
    Array.isArray(thread.participantsIds) && thread.participantsIds.length > 0;
  const hasLegacy = !!thread.buyerId && !!thread.sellerId;

  if (!hasNew && (hasOld || hasLegacy)) {
    thread.participants = hasOld
      ? thread.participantsIds
      : [thread.buyerId, thread.sellerId];
    thread.participantsIds = undefined; // drop old field
    try {
      await thread.save();
    } catch {
      // non-fatal (in case we loaded with .lean() elsewhere)
    }
  }
  return thread;
}

/** Utility: return normalized array of member ids as strings */
function getMemberStrings(t) {
  const raw =
    (Array.isArray(t.participants) && t.participants.length
      ? t.participants
      : Array.isArray(t.participantsIds) && t.participantsIds.length
      ? t.participantsIds
      : [t.buyerId, t.sellerId].filter(Boolean)) || [];
  // Handle populated docs or plain ids
  return raw.map((p) => String(p?._id || p));
}

/**
 * POST /api/threads/start
 * Create (or reuse) a thread between current user and the listing owner.
 * Body: { listingId }
 */
router.post("/start", auth, async (req, res) => {
  try {
    const { listingId } = req.body || {};
    if (!listingId || !mongoose.isValidObjectId(listingId)) {
      return res.status(400).json({ ok: false, error: "listingId required" });
    }

    const listing = await Listing.findById(listingId)
      .select("ownerId")
      .lean();
    if (!listing) {
      return res.status(404).json({ ok: false, error: "Listing not found" });
    }

    const buyerId = String(req.user.id);
    const sellerId = String(listing.ownerId);
    if (buyerId === sellerId) {
      return res
        .status(400)
        .json({ ok: false, error: "You can't message yourself" });
    }

    // Idempotent: find existing thread or create one
    const pair = [buyerId, sellerId].sort();

    // Find existing by any schema shape (new/old/legacy)
    let thread =
      (await Thread.findOne({
        listingId,
        participants: { $all: pair },
      })) ||
      (await Thread.findOne({
        listingId,
        participantsIds: { $all: pair },
      })) ||
      (await Thread.findOne({
        listingId,
        $or: [
          { buyerId: buyerId, sellerId: sellerId },
          { buyerId: sellerId, sellerId: buyerId },
        ],
      }));

    // Migrate legacy thread if needed
    thread = await migrateParticipantsIfNeeded(thread);

    // Create if none exists
    if (!thread) {
      thread = await Thread.create({
        listingId,
        participants: pair, // always write new field
        lastMsgAt: new Date(),
        lastMsgSnippet: "",
      });
    }

    return res.json({ ok: true, data: thread });
  } catch (e) {
    // If a race still triggers E11000, fetch and return the existing thread
    if (e?.code === 11000) {
      try {
        const { listingId } = req.body || {};
        const listing = await Listing.findById(listingId)
          .select("ownerId")
          .lean();
        const buyerId = String(req.user.id);
        const sellerId = String(listing?.ownerId || "");
        const pair = [buyerId, sellerId].sort();

        let existing =
          (await Thread.findOne({
            listingId,
            participants: { $all: pair },
          })) ||
          (await Thread.findOne({
            listingId,
            participantsIds: { $all: pair },
          })) ||
          (await Thread.findOne({
            listingId,
            $or: [
              { buyerId: buyerId, sellerId: sellerId },
              { buyerId: sellerId, sellerId: buyerId },
            ],
          }));

        existing = await migrateParticipantsIfNeeded(existing);
        if (existing) return res.json({ ok: true, data: existing });
      } catch {
        // fall through to 500 below
      }
    }
    console.error("POST /threads/start", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/threads/mine
 * List threads the current user participates in.
 * Populates listing (title, image) + owner (seller) + participants.
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const me = String(req.user.id);

    const threads = await Thread.find({
      $or: [
        { participants: me },
        { participantsIds: me },
        { buyerId: me },
        { sellerId: me },
      ],
    })
      .sort({ lastMsgAt: -1, updatedAt: -1 })
      .populate({
        path: "listingId",
        select: "title imageUrl ownerId",
        populate: { path: "ownerId", select: "name email" },
      })
      .populate("participants", "name email")
      .lean();

    return res.json({ ok: true, data: threads });
  } catch (e) {
    console.error("GET /threads/mine", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/threads/:id
 * Thread meta: participants + listing (+listing owner)
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: "Bad thread id" });
    }

    const t = await Thread.findById(id)
      .populate({
        path: "listingId",
        select: "title imageUrl ownerId",
        populate: { path: "ownerId", select: "name email" },
      })
      .populate("participants", "name email");

    if (!t) {
      return res.status(404).json({ ok: false, error: "Thread not found" });
    }

    await migrateParticipantsIfNeeded(t);
    // mark thread as read for me
    const me = String(req.user.id);
    t.lastRead = t.lastRead || new Map();
    t.lastRead.set(me, new Date());
    await t.save();


    const members = getMemberStrings(t);
    if (!members.includes(String(req.user.id))) {
      return res.status(403).json({ ok: false, error: "Not a participant" });
    }

    return res.json({ ok: true, data: t.toObject() });
  } catch (e) {
    console.error("GET /threads/:id", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/threads/:id/messages
 * Fetch messages in a thread (asc by createdAt).
 */
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: "Bad thread id" });
    }

    let t = await Thread.findById(id);
    if (!t) {
      return res.status(404).json({ ok: false, error: "Thread not found" });
    }

    await migrateParticipantsIfNeeded(t);

    const members = getMemberStrings(t);
    if (!members.includes(String(req.user.id))) {
      return res.status(403).json({ ok: false, error: "Not a participant" });
    }

    const msgs = await Message.find({ threadId: id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email")
      .lean();

    return res.json({ ok: true, data: msgs });
  } catch (e) {
    console.error("GET /threads/:id/messages", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/threads/:id/messages
 * Send a message in a thread.
 * Body: { content }
 */
router.post("/:id/messages", auth, async (req, res) => {
  try {
    const threadId = req.params.id;
    const { content } = req.body || {};

    if (!mongoose.isValidObjectId(threadId)) {
      return res.status(400).json({ ok: false, error: "Bad thread id" });
    }
    if (!content?.trim()) {
      return res.status(400).json({ ok: false, error: "content required" });
    }

    let t = await Thread.findById(threadId);
    if (!t) {
      return res.status(404).json({ ok: false, error: "Thread not found" });
    }

    await migrateParticipantsIfNeeded(t);

    const members = getMemberStrings(t);
    if (!members.includes(String(req.user.id))) {
      return res.status(403).json({ ok: false, error: "Not a participant" });
    }

    const msg = await Message.create({
      threadId,
      senderId: req.user.id,
      content: content.trim(),
    });

    t.lastMsgAt = new Date();
    t.lastMsgSnippet = content.slice(0, 120);
    await t.save();

    return res.status(201).json({ ok: true, data: msg });
  } catch (e) {
    console.error("POST /threads/:id/messages", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});
// ADD near the bottom of routes/threads.js
// routes/threads.js  (add or replace your unread route)
// ...

router.get("/unread", auth, async (req, res) => {
  try {
    const meStr = String(req.user.id);
    const meId = new mongoose.Types.ObjectId(meStr);

    // find threads I belong to (supports new/old/legacy shapes)
    const threads = await Thread.find({
      $or: [
        { participants: meStr },
        { participantsIds: meStr },
        { buyerId: meId },
        { sellerId: meId },
      ],
    }).select("_id lastRead").lean();

    const perThread = {};
    let total = 0;

    await Promise.all(
      threads.map(async (t) => {
        const lastReadAt = (t.lastRead && (t.lastRead.get?.(meStr) || t.lastRead[meStr])) || null;

        const query = {
          threadId: t._id,
          // IMPORTANT: compare ObjectIds, not strings
          senderId: { $ne: meId },
        };
        if (lastReadAt) query.createdAt = { $gt: lastReadAt };

        const c = await Message.countDocuments(query);
        if (c > 0) {
          perThread[t._id] = c;
          total += c;
        }
      })
    );

    res.json({ ok: true, data: { total, perThread } });
  } catch (e) {
    console.error("GET /threads/unread", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});



export default router;
