import json
import logging
import os
import re

from groq import Groq

from .models import LearnResponse
from .prompts import get_learn_prompt

logger = logging.getLogger(__name__)

# ============================================================
# GROQ CONFIGURATION
# ============================================================
MODEL_NAME = "openai/gpt-oss-20b"

# ============================================================
# GENERATE LESSON
# ============================================================

def generate_lesson(topic: str, mode: str) -> dict:
    logger.info("Generating lesson -> topic='%s', mode='%s'", topic, mode)

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    try:
        client = Groq(api_key=api_key)
        prompt = get_learn_prompt(topic=topic, mode=mode)

        logger.info("Sending request to Groq -> mode=%s", mode)

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are LearnWise AI, an expert educational tutor. "
                        "CRITICAL RULES: "
                        "1. You MUST return ONLY a valid, COMPLETE JSON object. "
                        "2. Your JSON MUST contain exactly these 3 keys: "
                        "'explanation', 'key_concepts', and 'quiz'. "
                        "3. Keep the explanation concise (UNDER 400 words). "
                        "4. Output RAW JSON ONLY. No markdown, no extra text."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.7,
            max_tokens=4500,
        )

        content = response.choices[0].message.content

        try:
            content = re.sub(
                r"<think>.*?</think>",
                "",
                content,
                flags=re.DOTALL
            ).strip()

            start_idx = content.find("{")
            end_idx = content.rfind("}")

            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx + 1]
                raw_data = json.loads(json_str)
            else:
                raise ValueError("No JSON object found in the AI response.")

        except Exception as error:
            logger.error(
                "Invalid JSON returned by Groq. Raw content: %s",
                content
            )
            raise RuntimeError("AI returned invalid JSON.") from error

        validated_data = LearnResponse(**raw_data)

        logger.info("Lesson successfully validated.")

        return validated_data.model_dump()

    except RuntimeError:
        raise

    except Exception as error:
        logger.error(
            "Groq generation failed: %s",
            error,
            exc_info=True
        )
        raise RuntimeError(
            f"Groq generation failed: {error}"
        ) from error