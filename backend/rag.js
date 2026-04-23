import { Message } from "./db.js";
import axios from "axios";

const HAS_DB = !!process.env.MONGO_URI;

// -----------------------------
// 🔗 EMBEDDING FUNCTION
// -----------------------------
async function embed(text) {
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: text
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.data[0].embedding;

  } catch (e) {
    console.error("❌ Embedding failed:", e.message);
    return null;
  }
}

// -----------------------------
// 📐 COSINE SIMILARITY
// -----------------------------
function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;

  const len = Math.min(a.length, b.length);
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}

// -----------------------------
// 💾 SAVE MESSAGE
// -----------------------------
export async function saveMessage(name, message, role) {
  if (!HAS_DB) return; // 🚫 Skip if no DB

  try {
    const embedding = await embed(message);

    await Message.create({
      name,
      message,
      embedding: embedding || [],
      role
    });

  } catch (e) {
    console.error("❌ Save failed:", e.message);
  }
}

// -----------------------------
// 🧠 RETRIEVE MEMORY (RAG)
// -----------------------------
export async function retrieveMemory(name, currentMessage) {
  if (!HAS_DB) return ""; // 🚫 No DB = no memory

  try {
    const embedding = await embed(currentMessage);
    if (!embedding) return "";

    const messages = await Message.find({ name })
      .sort({ createdAt: -1 })
      .limit(50);

    const scored = messages.map(m => ({
      text: m.message,
      score: cosineSimilarity(embedding, m.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // ✅ FIX (you had slice(5) → wrong)
      .map(m => m.text)
      .join("\n");

  } catch (e) {
    console.error("❌ Memory retrieval failed:", e.message);
    return "";
  }
}