import re

from pydantic import BaseModel, field_validator
from typing import Optional, List

VALID_TOPICS = {"vermenigvuldigen", "breuken", "vraagstukken", "optellen", "aftrekken", "delen"}
VALID_GRADES = set(range(1, 7))


class Problem(BaseModel):
    id: str
    topic: str
    grade: int
    story: Optional[str] = None
    question: str
    answer: int
    hint: str


class StartSessionRequest(BaseModel):
    topic: str
    grade: int
    count: int = 5

    @field_validator("topic")
    @classmethod
    def topic_must_be_safe(cls, v: str) -> str:
        if not re.fullmatch(r"[a-z_]+", v):
            raise ValueError("Ongeldig onderwerp")
        if v not in VALID_TOPICS:
            raise ValueError(f"Onbekend onderwerp: {v}")
        return v

    @field_validator("grade")
    @classmethod
    def grade_must_be_valid(cls, v: int) -> int:
        if v not in VALID_GRADES:
            raise ValueError(f"Ongeldig leerjaar: {v}")
        return v


class StartSessionResponse(BaseModel):
    session_id: int
    problems: List[Problem]


class SubmitAnswerRequest(BaseModel):
    session_id: int
    problem_id: str
    topic: str
    grade: int
    user_answer: str
    attempt_number: int = 1

    @field_validator("topic")
    @classmethod
    def topic_must_be_safe(cls, v: str) -> str:
        if not re.fullmatch(r"[a-z_]+", v):
            raise ValueError("Ongeldig onderwerp")
        if v not in VALID_TOPICS:
            raise ValueError(f"Onbekend onderwerp: {v}")
        return v

    @field_validator("grade")
    @classmethod
    def grade_must_be_valid(cls, v: int) -> int:
        if v not in VALID_GRADES:
            raise ValueError(f"Ongeldig leerjaar: {v}")
        return v


class SubmitAnswerResponse(BaseModel):
    correct: bool
    hint: Optional[str] = None
    error: Optional[str] = None


class TopicStats(BaseModel):
    topic: str
    attempted: int
    correct: int
    accuracy: float


class DashboardResponse(BaseModel):
    total_problems: int
    correct_rate: float
    total_sessions: int
    by_topic: List[TopicStats]
    low_pool_warning: bool
    last_generation_error: Optional[str] = None


class AdminStatusResponse(BaseModel):
    pool_counts: dict
    is_generating: dict
    last_error: Optional[str] = None
    last_generated_at: Optional[str] = None
