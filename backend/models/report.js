import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Report", reportSchema);
