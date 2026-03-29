<!-- /autoplan restore point: /c/Users/claude/.gstack/projects/math-adventure/master-autoplan-restore-20260329.md -->

# Plan: Rekenavontuur — Vlaamse wiskundeoefenapp voor kinderen

**Branch:** master
**Status:** Implemented — autoplan retrospective review
**Design doc:** `~/.gstack/projects/math-adventure/claude-unknown-design-20260329-175023.md`
**Previous eng review:** `~/.gstack/projects/math-adventure/claude-unknown-eng-review-test-plan-20260329-180713.md`

---

## Problem Statement

Build a locally hosted, self-hostable math practice website for a child in Belgium.
The app presents story-driven math word problems in Flemish Dutch (Belgisch-Nederlands),
tracks progress across sessions, and gives the parent a dashboard with accuracy breakdowns
and CSV export for school portfolios. Problem sets are generated offline by Codex CLI
and stored as JSON — no AI API calls at runtime.

Target audience: one kid at home; potentially open-sourced for the Flemish homeschool
and primary-school community as a no-subscription Prodigy/Rekenwonder alternative.

---

## Premises

1. Story mode = optional narrative skin. Problems work with or without narrative framing.
   Story sits above the problem as a nullable field in JSON schema. **Agreed.**

2. JSON files for v1 (not SQLite problems table). Admin UI deferred.
   **Implementation note: pipeline writes to per-topic JSON files, not SQLite problems table.**

3. Server-side SQLite for all session/answer data. No localStorage for persistence. **Agreed.**

4. Flemish Dutch (Belgisch-Nederlands) for all user-facing content — problem text, UI strings,
   error messages. Backend API responses in Dutch where user-visible. **Newly added.**

5. Codex pipeline auto-generates problems in background when pool falls below MIN_POOL=10.
   Fallback JSON files committed to repo for offline/no-Codex use. **Agreed.**

---

## What Was Built

### Backend (FastAPI + aiosqlite)

- `app/main.py` — FastAPI with CORS, startup DB init, 6 routes
- `app/models.py` — Pydantic models for all request/response shapes
- `app/db.py` — aiosqlite connection pool, `MATH_DB_PATH` env override for tests, schema migration runner
- `app/codex_pipeline.py` — async Codex subprocess, extract_json, jsonschema validation, dedup, retry logic, fallback loading

### Frontend (React + Vite)

- `frontend/src/main.jsx` — entry, imports `global.css`
- `frontend/src/App.jsx` — BrowserRouter with `/` and `/dashboard` routes
- `frontend/src/global.css` — `:focus-visible` ring, box-sizing, base
- `frontend/src/components/PracticeScreen.jsx` — session loop, story banner, progress dots, answer input, feedback
- `frontend/src/components/Dashboard.jsx` — stats, topic table, CSV export link
- `frontend/src/components/StoryBanner.jsx` — renders story context (null-safe)
- `frontend/src/components/ProgressDots.jsx` — dot progress indicator

### Tests

- `tests/test_api.py` — 6 pytest tests covering session start, empty pool, correct/wrong/invalid answer, dashboard, CSV
- `tests/test_pipeline.py` — 8 pytest tests covering extract_json, validate, schema rejection
- `frontend/src/components/__tests__/PracticeScreen.test.jsx` — 5 vitest tests
- `frontend/src/components/__tests__/Dashboard.test.jsx` — 3 vitest tests

### Data

- `data/problems/fallback-multiplication-grade3.json` — 15 problems (Flemish Dutch)
- `data/problems/fallback-fractions-grade3.json` — 12 problems (Flemish Dutch)
- `data/problems/fallback-word-problems-grade3.json` — 12 problems (Flemish Dutch)

---

## What Was NOT Built (Deferred)

- README.md (setup instructions, Windows-specific steps, Codex pipeline docs)
- PDF export (v1.1 — school format TBD)
- Multi-kid profiles / login
- Admin UI for adding/editing problems
- Codex prompt in Dutch (current prompt generates English problems; Codex runtime generation is untested)
- `POST /api/admin/generate` manual trigger endpoint
- CI/CD (add when open-sourcing)
- E2E tests (Playwright — 2 flows marked in test plan)
- `requirements.txt` pinned to exact versions (currently approximate)

---

## Architecture (as implemented)

```
Browser (React/Vite :5173)
    │
    ├── GET/POST /api/* ──→ FastAPI (:8000)
    │                           │
    │                     aiosqlite (math.db)
    │                           │
    │                     codex_pipeline.py
    │                           │
    │                     data/problems/*.json
    │                           │
    │                     Codex CLI (subprocess, PATH)
    │
    └── /dashboard ──→ Dashboard.jsx
```

---

## Open Questions

1. Does Codex generate problems in Dutch if the prompt is in Dutch? Currently untested.
2. PDF report — what format does the Belgian school system expect?
3. Multiple kids on one machine — single profile assumption baked into current schema.
4. `requirements.txt` — exact version pins needed before open-sourcing.

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Dutch Codex prompt → required fix | P2 (boil lakes) | In blast radius; <30min; breaks stated Dutch premise | Deferring to v1.1 |
| 2 | CEO | README → required action | P2 (boil lakes) | Explicit success criterion depends on it | Skipping |
| 3 | CEO | Flemish localization = strength, not niche trap | P3 (pragmatic) | Intentional target; only self-hostable Dutch option | Codex "niche trap" framing |
| 4 | CEO | JSON files over SQLite problems table | P5 (explicit) | Simpler, git-diffable, correct for personal use | Revisiting schema |
| 5 | CEO | Multi-kid profiles → TODOS.md P3 | P2 (blast radius check) | Outside current blast radius | Auto-expanding scope |
| 6 | Design | Skip-on-last-problem → P2 TODOS | P1 (completeness) | Bug; in blast radius | Ignoring |
| 7 | Design | lang="nl" on html → P1 TODOS | P1 (completeness) | Accessibility baseline; trivial fix | Deferring |
| 8 | Eng | English error string → P1 TODOS | P1 (completeness) | User-facing Dutch content requirement | Deferring |
| 9 | Eng | Double load_problems() → P3 TODOS | P3 (pragmatic) | Low impact for household scale | Fixing now |
| 10 | Eng | Missing 9 test plan items → P2 TODOS | P1 (completeness) | Test coverage gap identified by test diagram | Skipping tests |

## Success Criteria

- Kid completes a 5-problem session without prompting from parent
- Parent dashboard accurately reflects session data within 1 second of session end
- CSV export opens correctly in Excel with Flemish Dutch topic names
- Another parent can set up and run following only the README (README not yet written)
- Codex generates 20 valid, grade-appropriate, Flemish Dutch problems
