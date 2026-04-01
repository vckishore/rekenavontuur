import asyncio
import csv
import io
import random
from datetime import datetime, date, timedelta
from pathlib import Path

import aiosqlite
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from .db import get_db, init_db, DB_PATH
from .models import (
    StartSessionRequest, StartSessionResponse,
    SubmitAnswerRequest, SubmitAnswerResponse,
    DashboardResponse, TopicStats, AdminStatusResponse, Problem,
    VALID_TOPICS,
)
from . import codex_pipeline

app = FastAPI(title="Math Adventure")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        await init_db(db)


@app.post("/api/sessions", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest):
    problems = codex_pipeline.load_problems(req.topic, req.grade)
    if not problems:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Geen opgaven beschikbaar voor onderwerp={req.topic} leerjaar={req.grade}. "
                "Controleer /api/admin/status voor de poolstatus."
            ),
        )
    count = codex_pipeline.pool_count(req.topic, req.grade)
    if count < codex_pipeline.MIN_POOL:
        asyncio.create_task(
            codex_pipeline.generate_problems(req.topic, req.grade)
        )

    selected = random.sample(problems, min(req.count, len(problems)))

    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO sessions (started_at) VALUES (?)",
            (datetime.utcnow().isoformat(),),
        )
        session_id = cursor.lastrowid
        await db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Databasefout: {e}")
    finally:
        await db.close()

    return StartSessionResponse(
        session_id=session_id,
        problems=[Problem(**p) for p in selected],
    )


@app.post("/api/answers", response_model=SubmitAnswerResponse)
async def submit_answer(req: SubmitAnswerRequest):
    try:
        user_int = int(req.user_answer.strip())
    except (ValueError, AttributeError):
        return SubmitAnswerResponse(
            correct=False,
            error="Voer een heel getal in",
        )

    problems = codex_pipeline.load_problems(req.topic, req.grade)
    problem = next((p for p in problems if p["id"] == req.problem_id), None)
    if problem is None:
        raise HTTPException(status_code=404, detail="Opgave niet gevonden")

    correct = user_int == problem["answer"]

    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO answers
               (session_id, problem_id, topic, grade, question_text,
                user_answer, correct, attempt_number, answered_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                req.session_id, req.problem_id, req.topic, req.grade,
                problem["question"],  # server-authoritative, not from client
                req.user_answer, int(correct),
                req.attempt_number, datetime.utcnow().isoformat(),
            ),
        )
        await db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Antwoord opslaan mislukt: {e}")
    finally:
        await db.close()

    return SubmitAnswerResponse(
        correct=correct,
        hint=problem["hint"] if not correct else None,
    )


@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard():
    db = await get_db()
    try:
        cur1 = await db.execute(
            "SELECT COUNT(*), COALESCE(AVG(correct) * 100, 0) FROM answers"
        )
        total_row = await cur1.fetchone()
        total_problems = total_row[0] if total_row else 0
        correct_rate = round(float(total_row[1]), 1) if total_row else 0.0

        cur2 = await db.execute("SELECT COUNT(*) FROM sessions")
        sessions_row = await cur2.fetchone()
        total_sessions = sessions_row[0] if sessions_row else 0

        cur3 = await db.execute(
            """SELECT topic, COUNT(*) as attempted, SUM(correct) as correct_count
               FROM answers GROUP BY topic"""
        )
        topic_rows = await cur3.fetchall()
        by_topic = [
            TopicStats(
                topic=row["topic"],
                attempted=row["attempted"],
                correct=row["correct_count"] or 0,
                accuracy=round(
                    (row["correct_count"] or 0) / row["attempted"] * 100, 1
                ),
            )
            for row in (topic_rows or [])
        ]

        cur4 = await db.execute(
            "SELECT DISTINCT date(answered_at) as day FROM answers ORDER BY day DESC"
        )
        day_rows = await cur4.fetchall()
        streak_days = 0
        if day_rows:
            days = [row[0] for row in day_rows]
            today = date.today()
            yesterday = today - timedelta(days=1)
            most_recent = date.fromisoformat(days[0])
            if most_recent >= yesterday:
                streak_days = 1
                for i in range(1, len(days)):
                    prev = date.fromisoformat(days[i - 1])
                    curr = date.fromisoformat(days[i])
                    if (prev - curr).days == 1:
                        streak_days += 1
                    else:
                        break
    finally:
        await db.close()

    # Check pool health for all known topics at grade 3
    low_pool = any(
        codex_pipeline.pool_count(topic, 3) < 5
        for topic in VALID_TOPICS
    )

    return DashboardResponse(
        total_problems=total_problems,
        correct_rate=correct_rate,
        total_sessions=total_sessions,
        streak_days=streak_days,
        by_topic=by_topic,
        low_pool_warning=low_pool,
        last_generation_error=codex_pipeline.get_last_error(),
    )


@app.get("/api/export/csv")
async def export_csv():
    db = await get_db()
    try:
        cur = await db.execute(
            """SELECT answered_at, topic, grade, question_text,
                      user_answer, correct, attempt_number
               FROM answers ORDER BY answered_at"""
        )
        rows = await cur.fetchall()
    finally:
        await db.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["datum", "onderwerp", "leerjaar", "vraag", "antwoord", "correct", "poging"]
    )
    for row in rows or []:
        writer.writerow([
            row["answered_at"], row["topic"], row["grade"],
            row["question_text"], row["user_answer"],
            "ja" if row["correct"] else "nee",
            row["attempt_number"],
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=rekenavontuur-voortgang.csv"
        },
    )


@app.get("/api/admin/status", response_model=AdminStatusResponse)
async def admin_status():
    pool_counts = {}
    for f in codex_pipeline.DATA_DIR.glob("*.json"):
        if f.stem.startswith("fallback-"):
            continue
        parts = f.stem.split("-grade")
        if len(parts) == 2:
            topic = parts[0]
            try:
                grade = int(parts[1])
                pool_counts[f"{topic}-g{grade}"] = codex_pipeline.pool_count(
                    topic, grade
                )
            except ValueError:
                pass

    return AdminStatusResponse(
        pool_counts=pool_counts,
        is_generating={
            f"{k[0]}-g{k[1]}": v
            for k, v in codex_pipeline._generating.items()
        },
        last_error=codex_pipeline.get_last_error(),
        last_generated_at=codex_pipeline.get_last_generated_at(),
    )


# Serve React static build in production
_dist = Path("frontend/dist")
if _dist.exists():
    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="static")
