import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const reviewSchema = new Schema(
  {
    reviewerId: { type: Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: Types.ObjectId, ref: "User", required: true },
    listingId:  { type: Types.ObjectId, ref: "Listing", required: true },
    offerId:    { type: Types.ObjectId, ref: "Offer" }, // optional; link if you have it
    rating:     { type: Number, min: 1, max: 5, required: true },
    comment:    { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// one review per (reviewer -> reviewee) for a listing
reviewSchema.index({ reviewerId: 1, revieweeId: 1, listingId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
