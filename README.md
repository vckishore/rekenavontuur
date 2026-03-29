# Rekenavontuur

Een zelfgehoste wiskundeoefenapp voor kinderen, in Belgisch-Nederlands.

Kinderen oefenen met verhaaltjesvragen (vermenigvuldigen, breuken, vraagstukken).
Ouders zien een overzicht met nauwkeurigheid per onderwerp en kunnen de voortgang
exporteren als CSV voor school.

Opgaven worden offline gegenereerd door de Codex CLI en opgeslagen als JSON —
geen AI-API-aanroepen tijdens gebruik.

---

## Vereisten

| Software | Minimale versie | Controleren |
|----------|----------------|-------------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Codex CLI | laatste versie | `codex --version` (optioneel — zie hieronder) |

**Windows-opmerking:** gebruik PowerShell of Windows Terminal. Als `python` niet
herkend wordt, probeer `python3`. Zorg dat Python toegevoegd is aan je PATH tijdens
de installatie (vink "Add Python to PATH" aan).

---

## Installatie

```bash
# 1. Kloon of pak het project uit
git clone <repo-url> rekenavontuur
cd rekenavontuur

# 2. Python-afhankelijkheden installeren
pip install -r requirements.txt

# 3. Frontend-afhankelijkheden installeren
cd frontend
npm install
cd ..
```

---

## Starten (ontwikkelmodus)

Je hebt twee terminals nodig:

**Terminal 1 — backend:**
```bash
uvicorn app.main:app --reload
```
De API draait op `http://localhost:8000`.

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in je browser.

---

## Starten (productiemodus)

```bash
# Bouw de frontend
cd frontend
npm run build
cd ..

# Start alleen de backend (serveert ook de frontend)
uvicorn app.main:app
```
Open `http://localhost:8000`.

---

## Configuratie

### Databasepad

Standaard wordt `math.db` aangemaakt in de projectmap. Je kunt dit aanpassen:

```bash
# Windows PowerShell
$env:MATH_DB_PATH = "C:\pad\naar\mijn\data\rekenavontuur.db"
uvicorn app.main:app --reload

# Bash / Windows Terminal (WSL)
MATH_DB_PATH=/pad/naar/data.db uvicorn app.main:app --reload
```

---

## Opgavenpipeline (Codex)

De app genereert automatisch nieuwe opgaven op de achtergrond wanneer de opgavenbank
voor een onderwerp minder dan 10 vragen bevat.

**Vereiste:** Codex CLI moet beschikbaar zijn via je systeem-PATH.

```bash
# Controleer of Codex beschikbaar is
codex --version
```

Als Codex niet beschikbaar is, valt de app terug op de meegeleverde reserve-opgavensets
in `data/problems/`. De app blijft werken — alleen worden er geen nieuwe opgaven gegenereerd.

### Reserve-opgavensets

De volgende sets worden meegeleverd en werken zonder Codex:

| Bestand | Onderwerp | Leerjaar | Opgaven |
|---------|-----------|----------|---------|
| `fallback-multiplication-grade3.json` | Vermenigvuldigen | 3 | 15 |
| `fallback-fractions-grade3.json` | Breuken | 3 | 12 |
| `fallback-word-problems-grade3.json` | Vraagstukken | 3 | 12 |

### Poolstatus bekijken

```
GET http://localhost:8000/api/admin/status
```

Toont het aantal beschikbare opgaven per onderwerp en de laatste generatietijd.

---

## Tests uitvoeren

```bash
# Backend (pytest)
pytest tests/ -v

# Frontend (vitest)
cd frontend
npm test
```

---

## Veelgestelde vragen

**De app start niet op Windows — `uvicorn` niet gevonden**
Zorg dat Python-scripts in je PATH staan: `pip install uvicorn` en probeer opnieuw.
Of gebruik `python -m uvicorn app.main:app --reload`.

**`npm run dev` geeft een foutmelding over ontbrekende modules**
Voer `npm install` uit in de `frontend/`-map.

**De Codex-pipeline genereert Engelse opgaven**
Zorg dat je de nieuwste versie van dit project gebruikt. De prompttaal is Belgisch-Nederlands
vanaf versie commit `30c796f`.

**Hoe voeg ik zelf opgaven toe?**
Bewerk de JSON-bestanden in `data/problems/` rechtstreeks. Elk object heeft:
```json
{
  "id": "uniek-id",
  "topic": "vermenigvuldigen",
  "grade": 3,
  "story": "Optionele verhaaltjescontext of null",
  "question": "De vraag",
  "answer": 24,
  "hint": "Tip voor als het fout is"
}
```

---

## Projectstructuur

```
rekenavontuur/
  app/
    main.py             # FastAPI routes
    models.py           # Pydantic modellen
    db.py               # aiosqlite verbinding + migraties
    codex_pipeline.py   # Achtergrondgeneratie via Codex CLI
  frontend/
    src/
      components/
        PracticeScreen.jsx   # Oefenscherm (kind)
        Dashboard.jsx        # Overzicht (ouder)
        StoryBanner.jsx      # Verhaaltjescontext
        ProgressDots.jsx     # Voortgangsindicator
  data/
    problems/           # JSON-opgavensets
  tests/                # pytest + vitest
  requirements.txt
```

---

## Licentie

MIT
