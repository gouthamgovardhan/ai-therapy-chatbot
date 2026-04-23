import mongoose from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017/therapy");

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  embedding: [Number],
  role: String,
  createdAt: { type: Date, default: Date.now }
});

export const Message = mongoose.model("Message", messageSchema);