from pydantic import BaseModel, Field, field_validator, model_validator


# ============================================================
# LEARNING MODES
# ============================================================

LEARNING_MODES = {
    "simple",
    "detailed",
    "study",
    "story",
    "exam",
    "practical",
}


# ============================================================
# QUIZ QUESTION
# ============================================================

class QuizQuestion(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        description="The diagnostic multiple choice question",
    )

    options: list[str] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="Exactly 4 options",
    )

    correct_answer: str = Field(
        ...,
        min_length=1,
        description="The correct option",
    )

    concept_tested: str = Field(
        ...,
        min_length=1,
        description="The exact key concept tested",
    )

    @model_validator(mode="after")
    def check_correct_answer(self):
        if self.correct_answer not in self.options:
            raise ValueError(
                f"correct_answer '{self.correct_answer}' "
                f"must be one of the options."
            )

        return self


# ============================================================
# AI LEARNING RESPONSE
# ============================================================

class LearnResponse(BaseModel):
    explanation: str = Field(
        ...,
        min_length=1,
        description="Complete teaching explanation",
    )

    key_concepts: list[str] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Exactly 3 key concepts",
    )

    quiz: list[QuizQuestion] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Exactly 3 quiz questions",
    )

    @model_validator(mode="after")
    def check_concepts_match(self):
        concepts = set(self.key_concepts)

        for index, question in enumerate(self.quiz):
            if question.concept_tested not in concepts:
                raise ValueError(
                    f"Question {index + 1} tests "
                    f"'{question.concept_tested}', which is not "
                    f"in key_concepts."
                )

        tested = [
            question.concept_tested
            for question in self.quiz
        ]

        if len(set(tested)) != 3:
            raise ValueError(
                "Each quiz question must test a different key concept."
            )

        return self


# ============================================================
# LEARN REQUEST
# ============================================================

class LearnRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    mode: str = Field(default="simple")
    # Naya field add kiya:
    user_email: str = Field(default="guest@learnwise.com")

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Topic cannot be empty.")
        return value

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in LEARNING_MODES:
            raise ValueError("Mode must be one of: " + ", ".join(sorted(LEARNING_MODES)))
        return value


# ============================================================
# HISTORY
# ============================================================

class HistoryItem(BaseModel):
    session_id: str
    topic: str
    mode: str
    explanation: str
    key_concepts: list[str]
    quiz: list[QuizQuestion]
    created_at: str


# ============================================================
# QUIZ ANSWER
# ============================================================

class QuizAnswer(BaseModel):
    question_index: int = Field(
        ...,
        ge=0,
    )

    selected_answer: str


# ============================================================
# QUIZ SUBMISSION
# ============================================================

class QuizSubmission(BaseModel):
    session_id: str
    # Naya field add kiya:
    user_email: str = Field(default="guest@learnwise.com")
    answers: list[QuizAnswer]


# ============================================================
# QUIZ RESULT
# ============================================================

class QuizResult(BaseModel):
    topic: str

    score: int = Field(
        ...,
        ge=0,
    )

    total: int = Field(
        ...,
        ge=1,
    )

    percentage: int = Field(
        ...,
        ge=0,
        le=100,
    )

    weak_concepts: list[str] = Field(
        default_factory=list,
    )