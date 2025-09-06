// backend/routes/listings.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authOptional from "../middleware/authOptional.js";
import { fileURLToPath } from "url";
import auth from "../middleware/auth.js";       // ✅ correct
import Listing from "../models/listing.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(_req, file, cb) {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});


router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    let {
      title,
      description = "",
      quantity = 1,
      imageUrl = "",
      tags = [],
      allergies = [],
    } = req.body || {};

    // If a file was uploaded directly, build a public URL for it
    if (req.file) {
      const publicPath = `/uploads/${req.file.filename}`;
      imageUrl = `${req.protocol}://${req.get("host")}${publicPath}`;
    }

    // Normalize tags & allergies (allow arrays OR comma-separated strings OR JSON strings)
    const normalize = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return String(val)
          .split(/[,\n]/g)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };
    tags = normalize(tags);
    allergies = normalize(allergies);
    


    const qty = Number(quantity) || 1;

    if (!title || !imageUrl) {
      return res
        .status(400)
        .json({ ok: false, error: "title and an image are required" });
    }

    const listing = await Listing.create({
      ownerId: req.user.id,
      title,
      description,
      quantity: qty,
      imageUrl,
      tags,
      allergies,
    });

    return res.status(201).json({ ok: true, data: listing });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ------------------------------------------------------------------
// GET /api/listings  – latest 50 (public)
// ------------------------------------------------------------------
router.get("/debug-ping", (_req, res) => res.json({ ok: true, t: Date.now() }));


router.get("/", authOptional, async (req, res) => {
  try {
    console.log("HIT GET /api/listings", req.query); // debug

    const { q, tags, allergies, status, mine } = req.query;
    const filter = {};
    filter.isHidden = { $ne: true };

    // text search
    if (q && q.trim()) filter.$text = { $search: q.trim() };

    // helper: CSV -> regex[]
    const toRegexArray = (csv) =>
      csv
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
        
    // tags filter
    if (tags && tags.trim()) {
      const r = toRegexArray(tags);
      if (r?.length) {
        filter.$or = [...(filter.$or || []), { tags: { $in: r } }];
      }
    }

    // allergies filter
    if (allergies && allergies.trim()) {
      const r = toRegexArray(allergies);
      if (r?.length) {
        filter.$or = [...(filter.$or || []), { allergies: { $in: r } }];
      }
    }


    const docs = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ data: docs });
  } catch (e) {
    console.error("LISTINGS ERROR:", e);
    return res.status(500).json({ error: "Server error in /api/listings" });
  }
});


// ------------------------------------------------------------------
// GET /api/listings/mine  – listings owned by the logged-in user
// ------------------------------------------------------------------
router.get("/mine", auth, async (req, res) => {
  try {
    const items = await Listing.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("ownerId", "name email ratingAvg ratingCount")

      .lean();
    return res.json({ ok: true, data: items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });;

  }
});


// POST /api/listings/:id/report
router.post("/:id/report", auth, async (req, res) => {
  try {
    console.log("REPORT listing", req.params.id);   // debug
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportedCount: 1 } },
      { new: true }                     // return incremented doc
    );
    if (!doc) return res.status(404).json({ error: "Not found" });

    // optional auto-hide at 3
    if (doc.reportedCount >= 3 && !doc.isHidden) {
      doc.isHidden = true;
      await doc.save();
    }

    return res.json({ ok: true, data: doc });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});




export default router;
