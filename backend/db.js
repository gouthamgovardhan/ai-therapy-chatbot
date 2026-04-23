import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  embedding: [Number],
  role: String,
  createdAt: { type: Date, default: Date.now }
});

export const Message = mongoose.model("Message", messageSchema);