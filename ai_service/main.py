from fastapi import FastAPI
from pydantic import BaseModel
from llm import generate_response

app = FastAPI()

# ✅ FIXED ROOT (supports wait-on)
@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    message: str
    name: str
    memory: str = ""
    stage: str = "INTRO"

@app.post("/chat")
async def chat(req: ChatRequest):
    reply = generate_response(
        req.message,
        req.name,
        req.memory,
        req.stage
    )
    return {"reply": reply}