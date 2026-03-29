from pydantic import BaseModel
from typing import Optional, List


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


class StartSessionResponse(BaseModel):
    session_id: int
    problems: List[Problem]


class SubmitAnswerRequest(BaseModel):
    session_id: int
    problem_id: str
    topic: str
    grade: int
    question_text: str
    user_answer: str
    attempt_number: int = 1


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
