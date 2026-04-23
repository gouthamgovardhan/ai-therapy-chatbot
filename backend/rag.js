import { Message } from "./db.js";
import axios from "axios";

async function embed(text) {
  console.log("Embedding text:", text);
  console.log("API KEY PRESENT:", !!process.env.OPENROUTER_API_KEY);

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
}

function cosineSimilarity(a, b) {
  const len = Math.min(a.length, b.length);
  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
}

export async function saveMessage(name, message, role) {
  try {
    const embedding = await embed(message);
    await Message.create({ name, message, embedding, role });
  } catch (e) {
    console.error("Embedding failed:", e.message);

    // fallback: save without embedding
    await Message.create({ name, message, embedding: [], role });
  }
}

export async function retrieveMemory(name, currentMessage) {
  try {
    const embedding = await embed(currentMessage);

    const messages = await Message.find({ name })
      .sort({ createdAt: -1 })
      .limit(50);

    const scored = messages.map(m => ({
      text: m.message,
      score: cosineSimilarity(embedding, m.embedding || [])
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(5)
      .map(m => m.text)
      .join("\n");

  } catch (e) {
    console.error("Memory fallback:", e.message);
    return ""; // no memory instead of crash
  }
}
console.log("API KEY:", process.env.OPENROUTER_API_KEY);