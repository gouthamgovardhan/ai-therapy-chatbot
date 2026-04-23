import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import axios from "axios";
import { EventEmitter } from "events";
EventEmitter.defaultMaxListeners = 20;

// ---------------- ENV ----------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("API KEY:", process.env.OPENROUTER_API_KEY ? "LOADED" : "MISSING");

// Disable proxy (important)
process.env.HTTP_PROXY = "";
process.env.HTTPS_PROXY = "";

// ---------------- APP ----------------
const app = express();
app.use(cors());
app.use(express.json());

// ---------------- DB + HELPERS ----------------
import "./db.js";
import { Message } from "./db.js";
import { saveMessage, retrieveMemory } from "./rag.js";
import { buildPersonality } from "./personality.js";

// ---------------- AI URL ----------------
const AI_URL = process.env.AI_URL || "http://127.0.0.1:8001";
console.log("AI SERVICE:", AI_URL);

// ---------------- THERAPY STAGE ----------------
function detectStage(memory) {
  if (!memory || memory.length < 50) return "INTRO";
  if (memory.length < 200) return "EXPLORE";
  if (memory.length < 400) return "EMOTION";
  if (memory.length < 700) return "PATTERN";
  return "GUIDANCE";
}

// ---------------- CHAT ----------------
app.post("/chat", async (req, res) => {
  try {
    const { message, name } = req.body;

    console.log("📩 Incoming:", message);

    // Save user message
    await saveMessage(name, message, "user");

    // Get memory
    let memory = "";
    try {
      memory = await retrieveMemory(name, message);
    } catch {
      console.log("⚠️ Memory failed");
    }

    // Detect stage
    const stage = detectStage(memory);
    console.log("🧠 Stage:", stage);

    // Optional personality
    buildPersonality(name, memory);

    // Call AI
    const aiRes = await axios.post(`${AI_URL}/chat`, {
      message,
      name,
      memory,
      stage
    });

    const reply = aiRes.data.reply;

    console.log("💬 AI:", reply);

    // Save AI reply
    await saveMessage(name, reply, "bot");

    res.json({ reply });

  } catch (err) {
    console.error("❌ ERROR:", err.message);

    res.status(500).json({
      reply: "Something went wrong. Try again."
    });
  }
});

// ---------------- HISTORY ----------------
app.get("/history", async (req, res) => {
  const { name } = req.query;
  const chats = await Message.find({ name }).sort({ createdAt: 1 });
  res.json(chats);
});

// ---------------- TEST ----------------
app.get("/test-ai", async (req, res) => {
  try {
    const r = await axios.post(`${AI_URL}/chat`, {
      message: "hello",
      name: "test",
      memory: "",
      stage: "INTRO"
    });

    res.json({ success: true, data: r.data });

  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ---------------- START ----------------
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});