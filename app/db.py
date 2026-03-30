import aiosqlite
import os

DB_PATH = os.environ.get("MATH_DB_PATH", "math.db")

MIGRATIONS = [
    """CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
    """CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER REFERENCES sessions(id),
        problem_id TEXT,
        topic TEXT,
        grade INTEGER,
        question_text TEXT,
        user_answer TEXT,
        correct INTEGER,
        attempt_number INTEGER DEFAULT 1,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
]


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    return db


async def init_db(db):
    await db.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)"
    )
    row = await db.execute_fetchone(
        "SELECT COALESCE(MAX(version), 0) FROM schema_version"
    )
    current = row[0] if row else 0
    for i, migration in enumerate(MIGRATIONS[current:], start=current + 1):
        await db.execute(migration)
        await db.execute(
            "INSERT OR REPLACE INTO schema_version VALUES (?)", (i,)
        )
    await db.commit()
