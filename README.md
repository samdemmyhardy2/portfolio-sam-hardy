# Sam Hardy — Portfolio

Two layers in this repo:

| Layer | Command | URL | Role |
|-------|---------|-----|------|
| **Fallback** (static) | `npm run fallback` | http://localhost:3001 | Known-good safety net — always works |
| **Active** (Next.js) | `npm run dev` | http://localhost:3000 | Experiments & migration |

## Fallback first (safety net)

If Next.js breaks, Turbopack panics, or Cursor leaves the app in a bad state:

```bash
npm run fallback
```

Open **http://localhost:3001**. Source lives in [`web-main/`](web-main/) — see [`web-main/README.md`](web-main/README.md).

Do not treat `web-main/` as a scratch folder; it is the baseline to recover from.

## Next.js development

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. Edit `app/` and related files.

`npm run dev` uses webpack by default (more reliable here than Turbopack). For Turbopack: `npm run dev:turbo`.

## Christie’s case study

- Fallback: http://localhost:3001/projects/pageone.html
- Next (when built): http://localhost:3000/christies
