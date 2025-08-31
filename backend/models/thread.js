import mongoose from "mongoose";
const { Schema } = mongoose;

const ThreadSchema = new Schema(
  {
     participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    listingId: {type: Schema.Types.ObjectId,ref: "Listing",required: true,index: true,},
    lastMsgAt: { type: Date, default: null },
    lastMsgSnippet: { type: String, default: "" },
    lastRead: { type: Map, of: Date, default: {} },
    
  },
  { timestamps: true }
);

export default mongoose.model("Thread", ThreadSchema);
