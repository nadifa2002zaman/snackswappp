import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import listingsRoutes from "./routes/listings.js";
import uploadsRoutes from "./routes/upload.js";
import threadsRoutes from "./routes/threads.js";
import offersRoutes from "./routes/offers.js";
import reviewsRoutes from "./routes/review.js";
import adminRoutes from "./routes/admin.js";
import reportsRoutes from "./routes/reports.js";
// --- ESM dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- app ---
const app = express();

app.use((req, _res, next) => {
  console.log("[REQ]", req.method, req.originalUrl);
  next();
});





// --- CORS (allow preflight + JSON + Authorization) ---
const ORIGIN = "http://localhost:5173";
const corsOptions = {
  origin: ORIGIN,
  credentials: true, // safe even if you don't use cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options(/^\/api\/.*$/, cors(corsOptions));

// --- body parsing ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- static: serve uploaded files at /uploads/* ---
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// --- routes ---
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/threads", threadsRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);



// --- routes ---
app.get("/api/auth/_ping", (_req, res) => res.json({ ok: true, from: "index" })); // TEMP: test

// --- health ---
app.get("/", (_req, res) => res.send("snackswap API"));
app.get("/api/health", (_req, res) => res.json({ ok: true }));





// --- DB + server ---
const PORT = process.env.PORT || 5001; // matches your frontend .env
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URL;

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI (or MONGODB_URL) in .env");
  process.exit(1);
}

mongoose.set("strictQuery", true);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 API listening on http://localhost:${PORT}`);
      console.log(`🔓 CORS origin allowed: ${ORIGIN}`);
    });
  })
  .catch((err) => {
    console.error("❌ Mongo connection error:", err.message);
    process.exit(1);
  });
