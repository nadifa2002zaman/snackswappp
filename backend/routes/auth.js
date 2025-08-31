import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import auth from "../middleware/auth.js";


// if your auth middleware exists, you can add it later. Not needed for basic login/register.

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ ok:false, error:"Missing fields" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ ok:false, error:"Email in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    res.status(201).json({ ok:true, data:{ id:user._id, name:user.name, email:user.email } });
  } catch (e) {
    console.error("REGISTER error:", e);
    res.status(500).json({ ok:false, error:e.message });
  }
});

// POST /api/auth/login


// --- DIAGNOSTIC LOGIN (temporary) ---
router.post("/login", async (req, res) => {
  try {
    // 1) log the raw body (don’t print full password)
    console.log("LOGIN body:", {
      email: req.body?.email,
      passwordLen: typeof req.body?.password === "string" ? req.body.password.length : typeof req.body?.password
    });

    const { email, password } = req.body || {};
    if (!email || !password) {
      console.log("LOGIN early-fail: missing email or password");
      return res.status(400).json({ ok: false, code: "MISSING_FIELDS", error: "Missing email or password" });
    }

    // 2) find the user
    const user = await User.findOne({ email }).lean();
    console.log("LOGIN user found?:", !!user, user ? { id: user._id?.toString(), keys: Object.keys(user) } : null);

    if (!user) {
      return res.status(401).json({ ok: false, code: "USER_NOT_FOUND", error: "Invalid credentials" });
    }

    // 3) what field has the hash?
    const hashed = user.password ?? user.passwordHash;
    console.log("LOGIN hash info:", {
      hasPassword: typeof user.password,
      hasPasswordHash: typeof user.passwordHash,
      chosenType: typeof hashed,
      preview: typeof hashed === "string" ? hashed.slice(0, 12) + "…" : hashed
    });

    if (typeof hashed !== "string" || !hashed) {
      console.log("LOGIN NO_HASH for user:", user._id?.toString());
      return res.status(500).json({ ok: false, code: "NO_HASH", error: "Account has no password set. Please re-register." });
    }

    // 4) compare
    const ok = await bcrypt.compare(password, hashed);
    console.log("LOGIN bcrypt.compare:", ok);

    if (!ok) {
      return res.status(401).json({ ok: false, code: "BAD_PASSWORD", error: "Invalid credentials" });
    }

    // 5) success
    const token = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    console.log("LOGIN success for:", user._id?.toString());

    return res.json({
      ok: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (e) {
    console.error("LOGIN UNHANDLED ERROR:", e);
    return res.status(500).json({ ok: false, code: "UNHANDLED", error: "Server error during login" });
  }
});

// GET /api/auth/me – return current logged-in user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password") // don’t expose password hash
      .lean();

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, data: user });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// GET /api/auth/me  – return current logged-in user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password") // don't send hashed password
      .lean();

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, data: user });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
