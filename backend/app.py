import logging
import os
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .ai import generate_lesson
from .history import (clear_history, create_session, get_history, get_progress, get_quiz_history, get_session, save_quiz_result)
from .models import LearnRequest, QuizSubmission

# Automatically find and load .env no matter where you run the command from
load_dotenv(find_dotenv(), override=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="LearnWise AI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "LearnWise AI"}

@app.post("/api/learn")
def learn_endpoint(request: LearnRequest):
    logger.info("Learning request -> topic='%s', mode='%s'", request.topic, request.mode)
    try:
        lesson = generate_lesson(topic=request.topic, mode=request.mode)
        session_id = create_session(
            user_email=request.user_email, # Naya
            topic=request.topic,
            mode=request.mode,
            lesson=lesson,
        )
        return {
            "session_id": session_id,
            "topic": request.topic,
            "mode": request.mode,
            "explanation": lesson["explanation"],
            "key_concepts": lesson["key_concepts"],
            "quiz": lesson["quiz"],
        }
    except RuntimeError as error:
        logger.error("AI generation error: %s", error)
        raise HTTPException(status_code=500, detail=f"Failed to generate the lesson: {str(error)}")
    except Exception as error:
        logger.error("Unexpected error: %s", error, exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")

@app.post("/api/quiz/submit")
def submit_quiz(payload: QuizSubmission):
    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found.")

    quiz = session.get("quiz", [])
    if not quiz:
        raise HTTPException(status_code=400, detail="This session has no quiz.")

    answer_map = {ans.question_index: ans.selected_answer for ans in payload.answers}
    score, weak_concepts = 0, []

    for index, question in enumerate(quiz):
        if answer_map.get(index) == question["correct_answer"]:
            score += 1
        else:
            weak_concepts.append(question["concept_tested"])

    total = len(quiz)
    percentage = round((score / total) * 100) if total else 0

    result = save_quiz_result(
        user_email=payload.user_email, # Naya
        session_id=session_id,
        score=score,
        total=total,
        percentage=percentage,
        weak_concepts=weak_concepts,
    )

    if percentage == 100:
        performance = "Excellent! You mastered this topic."
    elif percentage >= 67:
        performance = "Good job! You understand most of it."
    elif percentage >= 34:
        performance = "You're getting there. Review the weak concepts."
    else:
        performance = "Review the lesson and try the quiz again."

    return {**result, "performance": performance}

@app.get("/api/history")
def history_endpoint(limit: int = Query(default=20, ge=1, le=100)):
    items = get_history(limit)
    return {"items": items, "total": len(items)}

@app.get("/api/progress")
def progress_endpoint(email: str): 
    return get_progress(email)