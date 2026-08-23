import uuid
import logging
from typing import Any
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# ============================================================
# SUPABASE DATABASE SETUP
# ============================================================
SUPABASE_URL = "https://gemldhvokzapkbskxben.supabase.co" 

# DHYAN DEIN: Yahan apni POORI lambi wali Anon key daalna. 
# Tumhari purani key message mein aadhi cut ho gayi thi.
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbWxkaHZva3phcGtic2t4YmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NzkxODcsImV4cCI6MjEwMzA1NTE4N30.GxTjWpofvS9hIuDTq6R7kNABhSG1ZNXUCX6vvMCXrSw"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============================================================
# SESSIONS
# ============================================================
def create_session(user_email: str, topic: str, mode: str, lesson: dict[str, Any]) -> str:
    session_id = str(uuid.uuid4())
    
    data = {
        "session_id": session_id,
        "user_email": user_email,
        "topic": topic,
        "mode": mode,
        "explanation": lesson["explanation"],
        "key_concepts": lesson["key_concepts"],
        "quiz": lesson["quiz"]
    }
    
    supabase.table("sessions").insert(data).execute()
    logger.info("Created learning session: %s for %s", session_id, user_email)
    return session_id

def get_session(session_id: str) -> dict[str, Any] | None:
    response = supabase.table("sessions").select("*").eq("session_id", session_id).execute()
    if response.data:
        return response.data[0]
    return None

def get_history(user_email: str, limit: int = 20) -> list[dict[str, Any]]:
    response = supabase.table("sessions").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
    return response.data

# ============================================================
# QUIZ RESULTS & PROGRESS
# ============================================================
def save_quiz_result(user_email: str, session_id: str, score: int, total: int, percentage: int, weak_concepts: list[str]) -> dict[str, Any]:
    session = get_session(session_id)
    if not session:
        raise ValueError("Learning session not found.")

    result_id = str(uuid.uuid4())
    
    data = {
        "result_id": result_id,
        "session_id": session_id,
        "user_email": user_email,
        "topic": session["topic"],
        "score": score,
        "total": total,
        "percentage": percentage,
        "weak_concepts": weak_concepts
    }
    
    supabase.table("quiz_results").insert(data).execute()
    logger.info("Saved quiz result for session %s: %s/%s", session_id, score, total)
    return data

def get_quiz_history(user_email: str, limit: int = 20) -> list[dict[str, Any]]:
    response = supabase.table("quiz_results").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
    return response.data

def get_progress(user_email: str) -> dict[str, Any]:
    # Fetch all user sessions and quiz results from cloud
    sessions_res = supabase.table("sessions").select("session_id").eq("user_email", user_email).execute()
    total_sessions = len(sessions_res.data)
    
    quizzes_res = supabase.table("quiz_results").select("percentage, weak_concepts").eq("user_email", user_email).execute()
    quizzes = quizzes_res.data
    
    total_quiz_attempts = len(quizzes)
    
    if total_quiz_attempts > 0:
        average_score = round(sum(q["percentage"] for q in quizzes) / total_quiz_attempts)
        best_score = max(q["percentage"] for q in quizzes)
    else:
        average_score = 0
        best_score = 0
        
    weak_counter = {}
    for q in quizzes:
        for concept in q["weak_concepts"]:
            weak_counter[concept] = weak_counter.get(concept, 0) + 1
            
    # Sort and pick top 5 weak concepts
    weak_concepts = [concept for concept, _ in sorted(weak_counter.items(), key=lambda item: item[1], reverse=True)][:5]

    return {
        "total_sessions": total_sessions,
        "total_quiz_attempts": total_quiz_attempts,
        "average_score": average_score,
        "best_score": best_score,
        "weak_concepts": weak_concepts,
    }

def clear_history(user_email: str) -> None:
    supabase.table("quiz_results").delete().eq("user_email", user_email).execute()
    supabase.table("sessions").delete().eq("user_email", user_email).execute()
    logger.info("Learning history cleared for user: %s", user_email)