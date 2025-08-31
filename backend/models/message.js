import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    threadId: { type: Schema.Types.ObjectId, ref: "Thread", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } } // ✅ important
);

MessageSchema.index({ threadId: 1, createdAt: 1 });

export default mongoose.model("Message", MessageSchema);
