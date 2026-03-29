"""
Backend API tests.
Run: pytest tests/ -v
"""
import json
import pytest
import pytest_asyncio
from pathlib import Path
from httpx import AsyncClient, ASGITransport

# Point DB to a temp file during tests
import os
os.environ["MATH_DB_PATH"] = ":memory:"

from app.main import app
from app import codex_pipeline


SAMPLE_PROBLEMS = [
    {
        "id": f"test-mult-g3-{i:03d}",
        "topic": "multiplication",
        "grade": 3,
        "story": None,
        "question": f"What is 3 x {i}?",
        "answer": 3 * i,
        "hint": f"Count 3 groups of {i}",
    }
    for i in range(1, 16)
]


@pytest.fixture(autouse=True)
def patch_problems(monkeypatch, tmp_path):
    """Serve sample problems without hitting disk."""
    monkeypatch.setattr(codex_pipeline, "load_problems", lambda t, g: SAMPLE_PROBLEMS)
    monkeypatch.setattr(codex_pipeline, "pool_count", lambda t, g: len(SAMPLE_PROBLEMS))


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_start_session_returns_problems(client):
    res = await client.post("/api/sessions", json={"topic": "multiplication", "grade": 3})
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert len(data["problems"]) == 5


@pytest.mark.asyncio
async def test_start_session_empty_pool(client, monkeypatch):
    monkeypatch.setattr(codex_pipeline, "load_problems", lambda t, g: [])
    res = await client.post("/api/sessions", json={"topic": "multiplication", "grade": 3})
    assert res.status_code == 503


@pytest.mark.asyncio
async def test_submit_correct_answer(client):
    sess = await client.post(
        "/api/sessions", json={"topic": "multiplication", "grade": 3}
    )
    data = sess.json()
    problem = data["problems"][0]
    res = await client.post("/api/answers", json={
        "session_id": data["session_id"],
        "problem_id": problem["id"],
        "topic": "multiplication",
        "grade": 3,
        "question_text": problem["question"],
        "user_answer": str(problem["answer"]),
        "attempt_number": 1,
    })
    assert res.status_code == 200
    assert res.json()["correct"] is True
    assert res.json()["hint"] is None


@pytest.mark.asyncio
async def test_submit_wrong_answer_returns_hint(client):
    sess = await client.post(
        "/api/sessions", json={"topic": "multiplication", "grade": 3}
    )
    data = sess.json()
    problem = data["problems"][0]
    res = await client.post("/api/answers", json={
        "session_id": data["session_id"],
        "problem_id": problem["id"],
        "topic": "multiplication",
        "grade": 3,
        "question_text": problem["question"],
        "user_answer": "9999",
        "attempt_number": 1,
    })
    assert res.json()["correct"] is False
    assert res.json()["hint"] is not None


@pytest.mark.asyncio
async def test_submit_non_integer_answer(client):
    sess = await client.post(
        "/api/sessions", json={"topic": "multiplication", "grade": 3}
    )
    data = sess.json()
    problem = data["problems"][0]
    res = await client.post("/api/answers", json={
        "session_id": data["session_id"],
        "problem_id": problem["id"],
        "topic": "multiplication",
        "grade": 3,
        "question_text": problem["question"],
        "user_answer": "abc",
        "attempt_number": 1,
    })
    assert res.json()["correct"] is False
    assert "whole number" in res.json()["error"].lower()


@pytest.mark.asyncio
async def test_dashboard_empty_db(client):
    res = await client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_problems"] == 0
    assert data["total_sessions"] == 0
    assert data["by_topic"] == []


@pytest.mark.asyncio
async def test_export_csv_empty_db(client):
    res = await client.get("/api/export/csv")
    assert res.status_code == 200
    assert "date,topic" in res.text
