"""
Backend API tests.
Run: pytest tests/ -v
"""
import pytest
import pytest_asyncio
import aiosqlite
from httpx import AsyncClient, ASGITransport

from app import codex_pipeline


SAMPLE_PROBLEMS = [
    {
        "id": f"vermenigvuldigen-g3-{i:03d}",
        "topic": "vermenigvuldigen",
        "grade": 3,
        "story": None,
        "question": f"Hoeveel is 3 x {i}?",
        "answer": 3 * i,
        "hint": f"Tel 3 groepjes van {i}",
    }
    for i in range(1, 16)
]


@pytest.fixture(autouse=True)
def patch_problems(monkeypatch):
    """Serve sample problems without hitting disk."""
    monkeypatch.setattr(codex_pipeline, "load_problems", lambda t, g: SAMPLE_PROBLEMS)
    monkeypatch.setattr(codex_pipeline, "pool_count", lambda t, g: len(SAMPLE_PROBLEMS))


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    """Each test gets its own temp DB file so connections share the same tables."""
    db_file = str(tmp_path / "test.db")
    monkeypatch.setenv("MATH_DB_PATH", db_file)

    # Patch DB_PATH in both db and main modules before the app starts
    import app.db as db_mod
    import app.main as main_mod
    monkeypatch.setattr(db_mod, "DB_PATH", db_file)
    monkeypatch.setattr(main_mod, "DB_PATH", db_file)

    # Init the schema on our file-based DB
    async with aiosqlite.connect(db_file) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        await db_mod.init_db(db)

    transport = ASGITransport(app=main_mod.app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_start_session_returns_problems(client):
    res = await client.post("/api/sessions", json={"topic": "vermenigvuldigen", "grade": 3})
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert len(data["problems"]) == 5


@pytest.mark.asyncio
async def test_start_session_empty_pool(client, monkeypatch):
    monkeypatch.setattr(codex_pipeline, "load_problems", lambda t, g: [])
    res = await client.post("/api/sessions", json={"topic": "vermenigvuldigen", "grade": 3})
    assert res.status_code == 503


@pytest.mark.asyncio
async def test_start_session_invalid_topic_rejected(client):
    """Path traversal / invalid topic must be blocked with 422."""
    res = await client.post("/api/sessions", json={"topic": "../../etc/passwd", "grade": 3})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_submit_correct_answer(client):
    sess = await client.post(
        "/api/sessions", json={"topic": "vermenigvuldigen", "grade": 3}
    )
    data = sess.json()
    problem = data["problems"][0]
    res = await client.post("/api/answers", json={
        "session_id": data["session_id"],
        "problem_id": problem["id"],
        "topic": "vermenigvuldigen",
        "grade": 3,
        "user_answer": str(problem["answer"]),
        "attempt_number": 1,
    })
    assert res.status_code == 200
    assert res.json()["correct"] is True
    assert res.json()["hint"] is None


@pytest.mark.asyncio
async def test_submit_wrong_answer_returns_hint(client):
    sess = await client.post(
        "/api/sessions", json={"topic": "vermenigvuldigen", "grade": 3}
    )
    data = sess.json()
    problem = data["problems"][0]
    res = await client.post("/api/answers", json={
        "session_id": data["session_id"],
        "problem_id": problem["id"],
        "topic": "vermenigvuldigen",
        "grade": 3,
        "user_answer": "9999",
        "attempt_number": 1,
    })
    assert res.json()["correct"] is False
    assert res.json()["hint"] is not None


@pytest.mark.asyncio
async def test_submit_non_integer_answer(client):
    sess = await client.post(
        "/api/sessions", json={"topic": "vermenigvuldigen", "grade": 3}
    )
    data = sess.json()
    problem = data["problems"][0]
    res = await client.post("/api/answers", json={
        "session_id": data["session_id"],
        "problem_id": problem["id"],
        "topic": "vermenigvuldigen",
        "grade": 3,
        "user_answer": "abc",
        "attempt_number": 1,
    })
    assert res.json()["correct"] is False
    assert "getal" in res.json()["error"].lower()


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
    assert "datum,onderwerp" in res.text
