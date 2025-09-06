// backend/routes/admin.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import Listing from "../models/listing.js";
import User from "../models/user.js";

const r = Router();
const guard = [auth, requireRole("admin")];


function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// GET /api/admin/listings?onlyReported=true
r.get("/listings", guard, async (req, res) => {
  const { onlyReported } = req.query;
  const q = onlyReported === "true" ? { reportedCount: { $gte: 1 } } : {};
  const items = await Listing.find(q).sort({ reportedCount: -1, createdAt: -1 }).lean();
  res.json({ data: items });
});






// --- dashboard summary
r.get("/dashboard", guard, async (_req, res) => {
  const [totalListings, hiddenListings, reportedOver3, totalUsers] = await Promise.all([
    Listing.countDocuments({}),
    Listing.countDocuments({ isHidden: true }),
    Listing.countDocuments({ reportedCount: { $gte: 3 } }),
    User.countDocuments({}),
  ]);
  res.json({ data: { totalListings, hiddenListings, reportedOver3, totalUsers } });
});

// --- moderation actions
r.patch("/listings/:id/hide", guard, async (req, res) => {
  const doc = await Listing.findByIdAndUpdate(req.params.id, { isHidden: true }, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ data: doc });
});

r.patch("/listings/:id/unhide", guard, async (req, res) => {
  const doc = await Listing.findByIdAndUpdate(req.params.id, { isHidden: false }, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ data: doc });
});

r.delete("/listings/:id", guard, async (req, res) => {
  const doc = await Listing.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ data: { ok: true } });
});

// --- minimal user moderation (ban/unban)
r.patch("/users/:id/ban", guard, async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true, projection: "name email role isVerified" });
  if (!u) return res.status(404).json({ error: "Not found" });
  res.json({ data: u });
});
r.patch("/users/:id/unban", guard, async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true, projection: "name email role isVerified" });
  if (!u) return res.status(404).json({ error: "Not found" });
  res.json({ data: u });
});

export default r;
