from dotenv import load_dotenv
import os
from openai import OpenAI

# Load env properly
load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")

print("AI KEY LOADED:", "YES" if API_KEY else "NO")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

def generate_response(message, name, memory, stage):

    stage_rules = {
        "INTRO": """
- Greet warmly using their name
- Ask how their day is going
- Make them feel comfortable
- Ask ONE simple question
""",

        "EXPLORE": """
- Ask what happened in their day
- Encourage them to explain more
- DO NOT give advice yet
""",

        "EMOTION": """
- Identify emotions
- Reflect back ("That sounds stressful")
- Validate feelings
- Ask how it affected them
""",

        "PATTERN": """
- Explore possible reasons
- Ask gentle "why" questions
- Connect patterns
""",

        "GUIDANCE": """
- Suggest small helpful steps
- Be supportive
- Do NOT be preachy
"""
    }

    system_prompt = f"""
You are a calm, empathetic therapist AI.

User: {name}

Conversation memory:
{memory if memory else "No past memory"}

Current stage: {stage}

Instructions:
{stage_rules.get(stage)}

Rules:
- Sound human, not robotic
- Keep response short (3-5 lines)
- ALWAYS ask a thoughtful question (except GUIDANCE)
- Do NOT rush to solutions
- First understand, then guide
"""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7
        )

        reply = response.choices[0].message.content

        # Force question if missing
        if stage != "GUIDANCE" and "?" not in reply:
            reply += "\n\nCan you tell me more about that?"

        return reply

    except Exception as e:
        print("AI ERROR:", str(e))
        return "I'm here with you. Something went wrong—can you try again?"