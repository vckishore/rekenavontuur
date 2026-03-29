"""Tests for the Codex content pipeline."""
import json
import pytest
from pathlib import Path
from app.codex_pipeline import extract_json, _validate_and_assign_id


def test_extract_json_clean_array():
    text = '[{"question": "3x4?", "answer": 12, "story": null, "hint": "multiply"}]'
    result = extract_json(text)
    assert result[0]["answer"] == 12


def test_extract_json_markdown_fenced():
    text = '```json\n[{"question": "2+2?", "answer": 4, "story": null, "hint": "add"}]\n```'
    result = extract_json(text)
    assert result[0]["answer"] == 4


def test_extract_json_with_preamble():
    text = 'Here are your problems:\n[{"question": "5x5?", "answer": 25, "story": null, "hint": "square"}]'
    result = extract_json(text)
    assert result[0]["answer"] == 25


def test_extract_json_garbage_raises():
    with pytest.raises(ValueError):
        extract_json("this is not json at all")


def test_validate_assigns_uuid_id():
    raw = {"story": None, "question": "3 x 4 = ?", "answer": 12, "hint": "multiply"}
    result = _validate_and_assign_id(raw, "multiplication", 3)
    assert result is not None
    assert result["id"].startswith("multiplication-g3-")
    assert result["answer"] == 12


def test_validate_rejects_float_answer():
    raw = {"story": None, "question": "1/2 = ?", "answer": 0.5, "hint": "half"}
    result = _validate_and_assign_id(raw, "fractions", 4)
    assert result is None


def test_validate_rejects_topic_mismatch():
    raw = {"story": None, "topic": "algebra", "question": "x+1=2?", "answer": 1, "hint": "subtract"}
    result = _validate_and_assign_id(raw, "multiplication", 3)
    assert result is None


def test_validate_rejects_grade_mismatch():
    raw = {"story": None, "grade": 8, "question": "3x4?", "answer": 12, "hint": "multiply"}
    result = _validate_and_assign_id(raw, "multiplication", 3)
    assert result is None
