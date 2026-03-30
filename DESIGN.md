# Design System — Rekenavontuur

## Product Context
- **What this is:** Self-hosted Dutch math practice app for children
- **Who it's for:** Grade 3 kids (~8–9 years old) using the practice screen daily; parents checking the dashboard occasionally
- **Space/industry:** Children's educational software (Belgisch-Nederlands)
- **Project type:** Web app — single-column practice flow + parent dashboard

## Aesthetic Direction
- **Direction:** Toy-adventure — chunky type and bold color as the hero. No mascots, no clipart. The math problems ARE the visual.
- **Decoration level:** Intentional — gradient story banner, colored card borders, subtle violet-tinted background. No decorative blobs, no icon grids.
- **Mood:** Energetic and trustworthy. A kid should feel like opening a game, not sitting down to homework. A parent should feel it's well-made and legible.

## Typography
- **Display/Hero (questions, headings):** Baloo 2 ExtraBold (800) — chunky, warm, like a children's book but not babyish. Full Dutch extended character support (é, ë, ij).
- **Body/UI (labels, feedback, body text):** Plus Jakarta Sans — clean, modern, reads well at small sizes.
- **Answer input / codes:** JetBrains Mono — makes digits feel precise and game-like.
- **Loading:** Google Fonts CDN via index.html `<link>` preconnect
- **Scale:**
  - Hero/done title: 28–32px Baloo 2 800
  - Problem text: 20–22px Baloo 2 700
  - Section heading: 20px Baloo 2 800
  - Body: 15px Plus Jakarta Sans 400/500
  - Labels/tags: 11–13px Plus Jakarta Sans 600
  - Mono tag/code: 10–13px JetBrains Mono 700
  - Answer input: 26px JetBrains Mono 700

## Color
- **Approach:** Balanced — strong primary, semantic correct/wrong, neutral surface
- **Background:** `#F5F3FF` — cool violet tint, crisp, not warm cream
- **Surface (cards):** `#FFFFFF`
- **Primary deep:** `#5B21B6`
- **Primary mid:** `#7C3AED`
- **Primary light:** `#8B5CF6`
- **Primary tint:** `#EDE9FE`
- **Primary gradient:** `linear-gradient(135deg, #5B21B6, #7C3AED)` — used on buttons, story banner, filled progress
- **Text:** `#1E1B4B`
- **Muted text:** `#6D7280`
- **Border default:** `#DDD6FE`
- **Border strong:** `#7C3AED`
- **Correct:** `#059669` / tint `#D1FAE5`
- **Wrong:** `#DC2626` / tint `#FEE2E2`
- **Shadows:** `0 4px 16px rgba(91,33,182,0.15)` — colored, not grey

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable (children need generous tap targets)
- **Minimum touch target:** 52px height for all interactive elements
- **Scale:** 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 48

## Layout
- **Approach:** Single-column centered
- **Max content width:** 540px (practice) / 600px (dashboard)
- **Border radius:**
  - Buttons, inputs, small chips: `8px`
  - Cards, panels: `14–16px`
  - Page frame, large containers: `20–24px`
  - Pills/badges: `9999px`
- **Card border:** `3px solid #7C3AED` (neutral) / `#059669` (correct) / `#DC2626` (wrong)

## Motion
- **Approach:** Intentional — every animation communicates state, nothing decorative
- **Correct answer:** Card border → green + `box-shadow` green glow, 200ms ease-out
- **Wrong answer:** Card shakes horizontally (translateX ±8px, 3 cycles, 350ms)
- **Progress dots:** fill with 150ms ease-in transition
- **Session complete:** CSS confetti burst (~20 particles, 1.2–2.4s fall)
- **Button hover:** `translateY(-1px)` + brighter shadow, 150ms
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Duration:** micro 100ms / short 150–200ms / medium 300–400ms

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-30 | Electric violet primary (#7C3AED) instead of blue | Every Dutch edu app is blue. Violet reads "adventure/magic" and stands out. |
| 2026-03-30 | Baloo 2 for problem text at 20px+ | Math question becomes a visual event, not a paragraph. Numbers feel important. |
| 2026-03-30 | Deep violet-navy text (#1E1B4B) instead of black | Warmer, ties into the palette, less "admin tool" feel. |
| 2026-03-30 | Gradient buttons and story banner | Kids apps in 2024 use color boldly; gradients here are contextually appropriate. |
