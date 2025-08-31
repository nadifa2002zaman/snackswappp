import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import Report from "../models/report.js";

import Listing from "../models/listing.js";


const router = express.Router();

// POST /api/reports
router.post("/", auth, async (req, res) => {
  try {
    const { listingId, reason } = req.body;
    if (!listingId) return res.status(400).json({ ok: false, error: "listingId required" });
    if (!reason) return res.status(400).json({ ok: false, error: "Reason required" });

    const report = await Report.create({
      reporterId: req.user.id,
      listingId,
      reason: String(reason).trim(),
    });
    // ⬇️ This makes Admin’s /admin/listings?onlyReported=true work
    const updated = await Listing.findByIdAndUpdate(
      listingId,
      { $inc: { reportedCount: 1 } },
      { new: true }
    );
    //optional: auto-hide when reports reach 3 (matches your /listings/:id/report logic)
    // Optional: auto-hide after 3 reports (matches your /listings/:id/report logic)
    if (updated && updated.reportedCount >= 3 && !updated.isHidden) {
      updated.isHidden = true;
      await updated.save();
    }






    res.status(201).json({ ok: true, data: report });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/reports (admin only)
router.get("/", auth, requireRole("admin"), async (_req, res) => {
  try {
    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .populate("listingId", "title imageUrl ownerId")
      .populate("reporterId", "name email")
      .lean();
    res.json({ ok: true, data: reports });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
