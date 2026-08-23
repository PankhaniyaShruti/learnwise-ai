import logging

from .history import get_session, save_quiz_result

logger = logging.getLogger(__name__)


def evaluate_quiz(session_id: str, answers: list[dict]) -> dict:
    """
    Evaluate submitted quiz answers for a learning session.
    """

    session = get_session(session_id)

    if not session:
        raise ValueError("Learning session not found.")

    quiz = session.get("quiz", [])

    if not quiz:
        raise ValueError("This session does not contain a quiz.")

    if len(answers) != len(quiz):
        raise ValueError(
            f"Expected {len(quiz)} answers, "
            f"but received {len(answers)}."
        )

    score = 0
    weak_concepts = []

    for answer in answers:
        question_index = answer.get("question_index")
        selected_answer = answer.get("selected_answer")

        if not isinstance(question_index, int):
            raise ValueError("Invalid question index.")

        if question_index < 0 or question_index >= len(quiz):
            raise ValueError("Question index is out of range.")

        question = quiz[question_index]

        if selected_answer == question["correct_answer"]:
            score += 1
        else:
            concept = question.get("concept_tested")

            if concept and concept not in weak_concepts:
                weak_concepts.append(concept)

    total = len(quiz)

    percentage = round((score / total) * 100)

    if percentage == 100:
        performance = "Excellent understanding!"
    elif percentage >= 67:
        performance = "Good understanding!"
    elif percentage >= 34:
        performance = "Keep practicing."
    else:
        performance = "Review the concepts and try again."

    result = {
        "topic": session["topic"],
        "score": score,
        "total": total,
        "percentage": percentage,
        "performance": performance,
        "weak_concepts": weak_concepts,
    }

    save_quiz_result(session_id, result)

    logger.info(
        "Quiz evaluated -> Session: %s, Score: %s/%s",
        session_id,
        score,
        total,
    )

    return result