import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  quantity: { type: Number, default: 1, min: 1 },
  imageUrl: { type: String, required: true },
  tags: [{ type: String }],
  allergies: [{ type: String }],

  // moderation
  reportedCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },

  status: { type: String, enum: ["available","reserved","closed"], default: "available" }
}, { timestamps: true });




// search across title/description/tags
listingSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Listing", listingSchema);
