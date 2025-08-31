import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // <-- store the bcrypt hash here
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },     // 0..5
    ratingCount: { type: Number, default: 0 },

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
