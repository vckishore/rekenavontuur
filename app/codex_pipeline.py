import asyncio
import json
import re
import uuid
import shutil
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

import jsonschema

logger = logging.getLogger(__name__)

DATA_DIR = Path("data/problems")
DATA_DIR.mkdir(parents=True, exist_ok=True)

ERROR_LOG = Path("codex-errors.log")
MIN_POOL = 10
CODEX_TIMEOUT = 120

_generating: dict = {}
_last_error: Optional[str] = None
_last_generated_at: Optional[str] = None

PROBLEM_SCHEMA = {
    "type": "object",
    "required": ["story", "question", "answer", "hint"],
    "properties": {
        "story": {"type": ["string", "null"]},
        "question": {"type": "string", "minLength": 5},
        "answer": {"type": "integer"},
        "hint": {"type": "string", "minLength": 3},
    },
    "additionalProperties": True,
}


def _problem_file(topic: str, grade: int) -> Path:
    return DATA_DIR / f"{topic}-grade{grade}.json"


def _fallback_file(topic: str, grade: int) -> Path:
    return DATA_DIR / f"fallback-{topic}-grade{grade}.json"


def load_problems(topic: str, grade: int) -> list:
    path = _problem_file(topic, grade)
    if path.exists():
        with path.open() as f:
            problems = json.load(f)
        return list({p["id"]: p for p in problems}.values())
    fallback = _fallback_file(topic, grade)
    if fallback.exists():
        with fallback.open() as f:
            return list({p["id"]: p for p in json.load(f)}.values())
    return []


def pool_count(topic: str, grade: int) -> int:
    return len(load_problems(topic, grade))


def is_generating_for(topic: str, grade: int) -> bool:
    return _generating.get((topic, grade), False)


def get_last_error() -> Optional[str]:
    return _last_error


def get_last_generated_at() -> Optional[str]:
    return _last_generated_at


def extract_json(text: str) -> list:
    match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        return json.loads(text[start: end + 1])
    raise ValueError("No JSON array found in Codex output")


def _validate_and_assign_id(raw: dict, topic: str, grade: int) -> Optional[dict]:
    try:
        jsonschema.validate(raw, PROBLEM_SCHEMA)
    except jsonschema.ValidationError as e:
        logger.warning("Schema validation failed: %s", e.message)
        return None
    if raw.get("topic") and raw["topic"].lower() != topic.lower():
        logger.warning("Topic mismatch: expected %s, got %s", topic, raw.get("topic"))
        return None
    if raw.get("grade") and raw["grade"] != grade:
        logger.warning("Grade mismatch: expected %d, got %d", grade, raw.get("grade"))
        return None
    return {
        "id": f"{topic}-g{grade}-{uuid.uuid4().hex[:8]}",
        "topic": topic,
        "grade": grade,
        "story": raw.get("story"),
        "question": raw["question"],
        "answer": int(raw["answer"]),
        "hint": raw["hint"],
    }


async def _run_codex(topic: str, grade: int, count: int = 20) -> list:
    codex_bin = shutil.which("codex")
    if not codex_bin:
        raise RuntimeError("Codex binary not found on PATH")

    prompt = (
        f"Genereer {count} wiskundige woordproblemen voor het {grade}e leerjaar, "
        f"onderwerp: {topic}. "
        "Schrijf alle teksten in verzorgd Belgisch-Nederlands (Vlaams). "
        "Geef ALLEEN een geldig JSON-array terug. Geen uitleg. Geen markdown. Geen codeblokken. "
        "Elk object heeft precies: story (string of null), question (string), "
        "answer (integer), hint (string). "
        f'Voorbeeld: [{{"story": null, "question": "3 x 8 = ?", "answer": 24, "hint": "Tel 3 groepen van 8"}}]'
    )

    proc = await asyncio.create_subprocess_exec(
        codex_bin, "exec", prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=CODEX_TIMEOUT)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        raise RuntimeError(f"Codex timed out after {CODEX_TIMEOUT}s")

    return extract_json(stdout.decode("utf-8", errors="replace"))


def _write_problems(topic: str, grade: int, new_problems: list):
    path = _problem_file(topic, grade)
    existing = {}
    if path.exists():
        with path.open() as f:
            for p in json.load(f):
                existing[p["id"]] = p
    for p in new_problems:
        if p["id"] not in existing:
            existing[p["id"]] = p
    with path.open("w") as f:
        json.dump(list(existing.values()), f, indent=2)


async def generate_problems(topic: str, grade: int):
    global _last_error, _last_generated_at
    key = (topic, grade)
    if _generating.get(key):
        return
    _generating[key] = True
    try:
        for attempt in range(2):
            try:
                raw_list = await _run_codex(topic, grade, count=20)
                valid = [
                    p for p in (
                        _validate_and_assign_id(r, topic, grade) for r in raw_list
                    ) if p
                ]
                if len(valid) >= 5:
                    _write_problems(topic, grade, valid)
                    _last_error = None
                    _last_generated_at = datetime.utcnow().isoformat()
                    return
                logger.warning(
                    "Attempt %d: only %d valid problems", attempt + 1, len(valid)
                )
            except Exception as e:
                logger.error("Generation attempt %d failed: %s", attempt + 1, e)
                _last_error = str(e)
                with ERROR_LOG.open("a") as f:
                    f.write(
                        f"{datetime.utcnow().isoformat()} [{topic} g{grade}] {e}\n"
                    )
    finally:
        _generating[key] = False
