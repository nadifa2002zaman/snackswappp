import express from "express";
import auth from "../middleware/auth.js";
import Review from "../models/review.js";
import User from "../models/user.js";

const r = express.Router();

// create a review (after a trade)
r.post("/", auth, async (req, res) => {
  try {
    const { revieweeId, listingId, offerId, rating, comment } = req.body;
    // must be logged in
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    // normalize user id shape
    const meId = String(req.user._id || req.user.id || "");

    // block self-review
    if (String(revieweeId) === meId) {
       return res.status(400).json({ error: "You cannot review yourself" });
    }

    const review = await Review.create({
       reviewerId: meId,              // ✅ always set by server
       revieweeId,
       listingId,
       offerId: offerId || undefined,
       rating,
       comment: comment?.trim() || "",
    });


    

    // recompute aggregate for reviewee
    const agg = await Review.aggregate([
      { $match: { revieweeId: review.revieweeId } },
      { $group: { _id: "$revieweeId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const { avg = 0, count = 0 } = agg[0] || {};
    await User.findByIdAndUpdate(review.revieweeId, {
      ratingAvg: Math.round((avg + Number.EPSILON) * 10) / 10,
      ratingCount: count,
    });

    res.json({ data: review });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: "You already reviewed this user for this listing" });
    }
    res.status(500).json({ error: e.message });
  }
});

// reviews I received
r.get("/me/received", auth, async (req, res) => {
  const rows = await Review.find({ revieweeId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ data: rows });
});

// reviews I wrote
r.get("/me/written", auth, async (req, res) => {
  const rows = await Review.find({ reviewerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ data: rows });
});

// reviews for a user (public)
r.get("/user/:id", async (req, res) => {
  try {
    const rows = await Review.find({ revieweeId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ data: rows });
  } catch (e) {
    console.error("reviews user error:", e);
    res.status(500).json({ error: e.message });
  }
});


export default r;
