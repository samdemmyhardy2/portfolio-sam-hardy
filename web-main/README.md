# Fallback portfolio (known-good baseline)

This folder is a **static HTML/CSS/JS** snapshot of the portfolio that works without Next.js, npm builds, or Turbopack.

Treat it as read-only unless you are intentionally updating the fallback itself.

## When to use it

- Next.js dev server crashes or won’t compile
- Cursor or experiments broke the `app/` code
- You need a quick demo or sanity check that the design still works

## Run locally

From the repo root:

```bash
npm run fallback
```

Open [http://localhost:3001](http://localhost:3001).

Christie’s case study: [http://localhost:3001/projects/pageone.html](http://localhost:3001/projects/pageone.html)

Givenchy sandbox (Christie’s copy + squiggle experiments): [http://localhost:3001/projects/givenchy-page.html](http://localhost:3001/projects/givenchy-page.html)

Squiggle scroll playground: [http://localhost:3001/projects/squiggle-playground.html](http://localhost:3001/projects/squiggle-playground.html)

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Home / hero navigation |
| `projects/pageone.html` | Christie’s case study |
| `css/style.css` | Shared styles |
| `js/script.js` | Shared behaviour |
| `js/colorable-palette.js` | Random accessible palettes (Colorable-style) |

**Colours:** click **Random** (bottom-right) or press **R** for a new WCAG AA text/background pair. Palette persists across pages in the same tab.
| `fonts/`, `img/` | Assets |

## Active development

Day-to-day experiments live in the repo root (`app/`, Next.js). Port changes **from** here **into** Next when stable — not the other way around unless you are resetting the fallback on purpose.
