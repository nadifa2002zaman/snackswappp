import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    ownerId:   { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true }, // listing owner
    offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true }, // sender (buyer)
    note:      { type: String, default: "" },
    status:    { type: String, enum: ["pending","accepted","rejected","canceled"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
