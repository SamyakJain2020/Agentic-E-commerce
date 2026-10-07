# samyak-jain.tech — monorepo

One Flask process serves a portfolio plus four independent web projects, all built to static files:

| Path | Project | Source dir |
|---|---|---|
| `/` | Portfolio (vCard-style: About / Resume / Projects / Contact) | `portfolio/` |
| `/aura` | **Aura** — agentic e-commerce: LLM shopping agent, biometric 1-step wallet checkout, hands-free voice shopping (Sarvam STT + Gemini), Razorpay checkout | `frontend/` + `backend/` |
| `/slidecraft` | **SlideCraft AI** — Gemini + Canva Connect API slide-deck generator with document upload, revision chat and PPTX export | `slidecraft-frontend/` + `backend/slidecraft.py`, `backend/pptx_export.py` |
| `/aurora/` | Aurora landing page (React + TS + Tailwind v4, hero video) | `aurora/` |
| `/fluxora/` | Fluxora landing page (React, hero video) | `fluxora/` |

## Stack

- **Backend:** Python 3.9, Flask, Flask-CORS, `requests`, `razorpay`, `pypdf`, `python-docx`, `python-pptx`;
  Gemini (`gemini-flash-latest`) for agents/deck generation, Sarvam AI (`saaras:v3`) for speech-to-text,
  Canva Connect API (OAuth + PKCE) for SlideCraft.
- **Frontends:** React 19 + Vite 8; Tailwind (v3 for portfolio/Aura/SlideCraft, v4 for Aurora), `motion`, `lenis`,
  `@heroicons/react`, `react-router-dom`.

## Structure

```
backend/                  Flask app (main.py = API + static serving), agent.py, data.py, slidecraft.py, pptx_export.py
frontend/                 Aura storefront (base path /aura/)
slidecraft-frontend/      SlideCraft UI (base path /slidecraft/)
portfolio/                Portfolio site (served at /)
aurora/  fluxora/         Landing pages (base paths /aurora/, /fluxora/)
deploy/                   restore.sh (full rebuild), flask_app.service, README.md (restore guide)
```

## Secrets and assets are NOT in this repo

- `backend/.env`, `frontend/.env` → see the `.env.example` files; real values are in the private S3 bucket.
- `*.mp4` hero videos and the resume PDF (personal details) → private S3 bucket.

**To rebuild the whole server from scratch (GitHub + S3 only), see [`deploy/README.md`](deploy/README.md).**

## Running locally

```bash
cd backend && pip install -r requirements.txt && python main.py   # note: main.py serves built dist/ folders from /opt/app/*
cd frontend && npm install && npm run dev                          # or any of the other frontend dirs
```
