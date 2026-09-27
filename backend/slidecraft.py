"""
SlideCraft AI — turns raw analysis + source docs into a brand-aligned slide deck
by combining Gemini Pro (extraction/reasoning) with the Canva Connect API
(OAuth, Brand Template search + autofill).
"""
import base64
import hashlib
import io
import json
import os
import secrets
import time
from urllib.parse import urlparse

import requests
from pypdf import PdfReader
from docx import Document as DocxDocument

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

CANVA_CLIENT_ID = os.environ.get("CANVA_CLIENT_ID")
CANVA_CLIENT_SECRET = os.environ.get("CANVA_CLIENT_SECRET")
CANVA_AUTH_URL = "https://www.canva.com/api/oauth/authorize"
CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"
CANVA_API_BASE = "https://api.canva.com/rest/v1"
CANVA_SCOPES = "design:content:write design:meta:read brandtemplate:meta:read brandtemplate:content:read profile:read asset:read"

# Single-tenant demo: one Canva connection (the site owner's), not per-visitor.
# PKCE verifiers are short-lived and keyed by the OAuth `state` param.
_PKCE_STORE = {}
_TOKEN_FILE = os.path.join(os.path.dirname(__file__), ".canva_tokens.json")


def _load_tokens():
    try:
        with open(_TOKEN_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"access_token": None, "refresh_token": None, "expires_at": 0}


def _save_tokens():
    try:
        with open(_TOKEN_FILE, "w") as f:
            json.dump(CANVA_TOKENS, f)
        os.chmod(_TOKEN_FILE, 0o600)
    except OSError:
        pass


CANVA_TOKENS = _load_tokens()

DEFAULT_BRAND = {
    "primaryHex": "#0f172a",
    "secondaryHex": "#475569",
    "accentHex": "#6366f1",
    "headerFont": "Inter",
    "bodyFont": "Inter",
    "tone": "Modern Corporate Neutral",
    "aesthetic": "Minimalist Corporate",
}

MAX_DOC_CHARS = 20000  # per-file cap so one huge PDF can't blow the Gemini prompt budget

# session_id -> [{"filename": str, "text": str, "chars": int}]
UPLOADS = {}
# session_id -> {"analysisText", "sourceText", "url", "brand", "slides", "canva", "chatHistory"}
DECKS = {}


# ---------------------------------------------------------------------------
# Document upload: text extraction (PDF / DOCX / TXT / MD)
# ---------------------------------------------------------------------------

def extract_text_from_upload(filename: str, raw: bytes) -> str:
    name = (filename or "").lower()
    try:
        if name.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
        elif name.endswith(".docx"):
            doc = DocxDocument(io.BytesIO(raw))
            text = "\n".join(p.text for p in doc.paragraphs)
        else:
            text = raw.decode("utf-8", errors="ignore")
    except Exception as e:
        text = f"[Could not extract text from {filename}: {e}]"
    return text.strip()[:MAX_DOC_CHARS]


def add_upload(session_id: str, filename: str, raw: bytes):
    text = extract_text_from_upload(filename, raw)
    entry = {"filename": filename, "text": text, "chars": len(text)}
    UPLOADS.setdefault(session_id, []).append(entry)
    return entry


def list_uploads(session_id: str):
    return [{"filename": u["filename"], "chars": u["chars"]} for u in UPLOADS.get(session_id, [])]


def _uploads_as_text(session_id: str) -> str:
    docs = UPLOADS.get(session_id, [])
    if not docs:
        return ""
    return "\n\n".join(f"--- {d['filename']} ---\n{d['text']}" for d in docs)


# ---------------------------------------------------------------------------
# Company logo (unavatar.io — free, no key; Clearbit's own logo API was
# deprecated in 2024, so this aggregates favicon/social sources instead)
# ---------------------------------------------------------------------------

def get_domain_logo(url: str):
    if not url:
        return None
    domain = url.strip()
    if not domain.startswith("http"):
        domain = f"https://{domain}"
    try:
        domain = urlparse(domain).netloc or urlparse(domain).path
        domain = domain.replace("www.", "").strip("/")
        if not domain or "." not in domain:
            return None
        logo_url = f"https://unavatar.io/{domain}?fallback=false"
        resp = requests.head(logo_url, timeout=6, allow_redirects=True)
        if resp.status_code == 200:
            return logo_url
    except requests.RequestException:
        pass
    return None


# ---------------------------------------------------------------------------
# Free image search (Wikimedia Commons — no API key required)
# ---------------------------------------------------------------------------

def search_free_image(query: str):
    try:
        resp = requests.get(
            "https://commons.wikimedia.org/w/api.php",
            params={
                "action": "query", "format": "json", "generator": "search",
                "gsrnamespace": 6, "gsrsearch": f"{query} filetype:bitmap",
                "gsrlimit": 3, "prop": "imageinfo", "iiprop": "url|mime",
                "iiurlwidth": 900,
            },
            headers={"User-Agent": "SlideCraftAI/1.0 (https://samyak-jain.tech)"},
            timeout=10,
        )
        resp.raise_for_status()
        pages = (resp.json().get("query") or {}).get("pages") or {}
        for page in pages.values():
            info = (page.get("imageinfo") or [{}])[0]
            mime = info.get("mime", "")
            url = info.get("thumburl") or info.get("url")
            if url and mime.startswith("image/") and "svg" not in mime:
                return url
    except requests.RequestException:
        pass
    return None


# ---------------------------------------------------------------------------
# Canva OAuth (Authorization Code + PKCE)
# ---------------------------------------------------------------------------

def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def build_authorize_url(redirect_uri: str) -> str:
    verifier = _b64url(secrets.token_bytes(48))
    challenge = _b64url(hashlib.sha256(verifier.encode()).digest())
    state = _b64url(secrets.token_bytes(16))
    _PKCE_STORE[state] = {"verifier": verifier, "created": time.time()}

    params = {
        "client_id": CANVA_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": CANVA_SCOPES,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
    query = "&".join(f"{k}={requests.utils.quote(str(v))}" for k, v in params.items())
    return f"{CANVA_AUTH_URL}?{query}"


def exchange_code(code: str, state: str, redirect_uri: str):
    entry = _PKCE_STORE.pop(state, None)
    if not entry:
        raise ValueError("Unknown or expired OAuth state")

    resp = requests.post(
        CANVA_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "code_verifier": entry["verifier"],
            "redirect_uri": redirect_uri,
            "client_id": CANVA_CLIENT_ID,
            "client_secret": CANVA_CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=20,
    )
    resp.raise_for_status()
    payload = resp.json()
    CANVA_TOKENS["access_token"] = payload["access_token"]
    CANVA_TOKENS["refresh_token"] = payload.get("refresh_token")
    CANVA_TOKENS["expires_at"] = time.time() + payload.get("expires_in", 3600) - 60
    _save_tokens()
    return payload


def _refresh_if_needed():
    if not CANVA_TOKENS["access_token"]:
        return
    if time.time() < CANVA_TOKENS["expires_at"]:
        return
    if not CANVA_TOKENS["refresh_token"]:
        return
    resp = requests.post(
        CANVA_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": CANVA_TOKENS["refresh_token"],
            "client_id": CANVA_CLIENT_ID,
            "client_secret": CANVA_CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=20,
    )
    if resp.ok:
        payload = resp.json()
        CANVA_TOKENS["access_token"] = payload["access_token"]
        CANVA_TOKENS["refresh_token"] = payload.get("refresh_token", CANVA_TOKENS["refresh_token"])
        CANVA_TOKENS["expires_at"] = time.time() + payload.get("expires_in", 3600) - 60
        _save_tokens()


def is_connected() -> bool:
    return bool(CANVA_TOKENS["access_token"])


def _canva_headers():
    _refresh_if_needed()
    return {"Authorization": f"Bearer {CANVA_TOKENS['access_token']}"}


# ---------------------------------------------------------------------------
# Canva Connect API: Brand Templates + Autofill
# ---------------------------------------------------------------------------

def list_brand_templates(limit=20):
    resp = requests.get(
        f"{CANVA_API_BASE}/brand-templates",
        headers=_canva_headers(),
        params={"limit": limit},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json().get("items", [])


def get_brand_template_dataset(template_id: str):
    resp = requests.get(
        f"{CANVA_API_BASE}/brand-templates/{template_id}/dataset",
        headers=_canva_headers(),
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json().get("dataset", {})


def create_autofill_job(brand_template_id: str, title: str, data: dict):
    resp = requests.post(
        f"{CANVA_API_BASE}/autofills",
        headers={**_canva_headers(), "Content-Type": "application/json"},
        json={"brand_template_id": brand_template_id, "title": title, "data": data},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["job"]


def poll_autofill_job(job_id: str, timeout_s=45):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        resp = requests.get(f"{CANVA_API_BASE}/autofills/{job_id}", headers=_canva_headers(), timeout=20)
        resp.raise_for_status()
        job = resp.json()["job"]
        if job["status"] in ("success", "failed"):
            return job
        time.sleep(2)
    return {"status": "timeout"}


def create_blank_presentation(title: str):
    """Fallback per spec: if no usable Brand Template exists, create a plain
    presentation design the user can pick up and finish manually in Canva."""
    resp = requests.post(
        f"{CANVA_API_BASE}/designs",
        headers={**_canva_headers(), "Content-Type": "application/json"},
        json={"design_type": {"type": "preset", "name": "presentation"}, "title": title},
        timeout=20,
    )
    resp.raise_for_status()
    return resp.json()["design"]


def _flatten_slide_text(slide: dict):
    """Pull every short text value out of a slide's (layout-specific) data
    blob, in roughly reading order, for template autofill mapping."""
    out = [slide.get("title", ""), slide.get("subtitle", "")]
    d = slide.get("data") or {}

    def walk(value):
        if isinstance(value, str):
            if value and value.lower() not in ("photo", "bullet-panels"):
                out.append(value)
        elif isinstance(value, dict):
            for v in value.values():
                walk(v)
        elif isinstance(value, list):
            for v in value:
                walk(v)

    walk(d)
    return [v for v in out if v]


def _map_slide_to_dataset_fields(dataset: dict, slide: dict):
    """Best-effort mapping: match slide plan fields onto whatever text/image
    fields the chosen brand template's dataset actually exposes."""
    data = {}
    field_names = list(dataset.keys())
    text_fields = [f for f in field_names if dataset[f].get("type") == "text"]
    ordered_values = _flatten_slide_text(slide)

    for i, field_name in enumerate(text_fields):
        if i < len(ordered_values):
            data[field_name] = {"type": "text", "text": str(ordered_values[i])[:500]}
    return data


# ---------------------------------------------------------------------------
# Gemini Pro: brand extraction + narrative slide plan
# ---------------------------------------------------------------------------

LAYOUTS_SPEC = """Every slide must pick exactly ONE "layout" from this list, matching layout to content —
never default everything to bullet lists. Each layout has its own "data" shape:

1. "stat-grid" — 4 to 8 KPI tiles. data: {"stats": [{"value": "96.7", "label": "STUDENTS PER TEACHER",
   "caption": "optional sub-caption", "hero": false, "delta": "optional e.g. +15.7%"}]}. Use "hero": true
   for at most 2 stats that should render larger/emphasized. Use for KPI dashboards, "by the numbers" slides.

2. "comparison-columns" — 2 to 4 side-by-side cards, each with a colored header and key:value rows.
   data: {"columns": [{"heading": "APSEZ — Adani Ports", "rows": [{"label": "Network", "value": "15 domestic
   ports + Haifa + NQXT"}]}]}. Use for comparing entities, options, competitors, before/after.

3. "table" — a grouped, color-banded data table. data: {"headers": ["Objective","KPI","Target","Initiative"],
   "groups": [{"label": "FINANCIAL PERSPECTIVE", "rows": [["Revenue growth","Revenue CAGR","25% FY26-28",
   "Tier 2/3 expansion"]]}]}. Use for scorecards, financial reports, structured multi-row comparisons.

4. "timeline" — 4 to 8 chronological milestones on a connector line. data: {"milestones": [{"marker": "1",
   "dateLabel": "2010/11", "title": "BRAND ESTABLISHMENT", "body": "Founded by X to do Y; first result Z."}]}.
   Use for history, roadmaps, phased plans.

5. "matrix-2x2" — a strategic 2x2 (never more, never fewer than 4 quadrants). data: {"xLabel": "Effort",
   "yLabel": "Impact", "quadrants": [{"title": "Eliminate", "bullets": ["...", "..."]}, {"title": "Raise",
   "bullets": [...]}, {"title": "Reduce", "bullets": [...]}, {"title": "Create", "bullets": [...]}]}
   (order: top-left, top-right, bottom-left, bottom-right). Use for ERRC grids, prioritization, positioning.

6. "bullet-panels" — 2 to 4 boxed panels of bullets (e.g. company-overview style facts), optionally with one
   photo. data: {"panels": [{"heading": "Key Activities", "bullets": ["...", "..."]}], "factRows":
   [{"label": "Founded", "value": "2010"}], "imageQuery": "optional 2-5 word photo search phrase"}.
   factRows is optional — use it for a compact key:value fact box (Founded/HQ/Sector/etc).

7. "metrics-viz" — one chart. data: {"vizType": "donut", "segments": [{"label": "Product", "value": 62.5}]}
   OR {"vizType": "bars", "bars": [{"label": "Total Revenue", "value": 39, "isPercent": true}]}. Values in
   a donut should sum to ~100. Use for revenue mix, allocation, progress-against-target bars.

8. "big-statement" — a section-divider / big-idea slide. data: {"statement": "<= 90 chars, the one big
   idea", "subtext": "<= 140 chars supporting line"}. Use sparingly (openers, section breaks, the ask/CTA).

9. "photo-feature" — narrative slide: title + 3-6 short bullets + one real photo. data: {"bullets": [...],
   "imageQuery": "2-5 word photographable search phrase"}. Use only when no structured layout above fits.
"""

SLIDE_JSON_SHAPE = f"""{{
  "deckTitle": "overall deck title, <= 70 chars",
  "brand": {{
    "primaryHex": "#RRGGBB",
    "secondaryHex": "#RRGGBB",
    "accentHex": "#RRGGBB",
    "headerFont": "string",
    "bodyFont": "string",
    "tone": "string, e.g. Bold Tech / Minimalist Corporate / Modern Organic",
    "aesthetic": "one short phrase"
  }},
  "slides": [
    {{
      "sectionTag": "e.g. SECTION 01 (short, or empty string)",
      "title": "Action/insight-driven title, <= 60 chars",
      "subtitle": "optional italic byline under the title, <= 140 chars, or empty string",
      "layout": "one of: stat-grid | comparison-columns | table | timeline | matrix-2x2 | bullet-panels | metrics-viz | big-statement | photo-feature",
      "data": {{ ...shape depends on layout, see spec... }},
      "transition": "one short sentence bridging THIS slide to the NEXT (empty string on the last slide)",
      "speakerNotes": "2-3 sentences of spoken narration for this slide"
    }}
  ]
}}"""

EXTRACTION_PROMPT = f"""You are the analysis engine for SlideCraft AI, a system that turns raw business
analysis into a dense, information-heavy, brand-aligned slide deck that reads as ONE continuous narrative —
built at the level of a professionally designed McKinsey/BCG-style corporate deck, not a generic AI slide.

Given the shopper-provided ANALYSIS, SOURCE DOCUMENTS, and (optionally) a COMPANY URL, produce a single
JSON object with this exact shape:

{SLIDE_JSON_SHAPE}

LAYOUT LIBRARY (pick deliberately per slide, mix layouts across the deck — do not use the same layout for
every slide; a good deck usually opens with big-statement or bullet-panels (company overview), has 1-2
stat-grid or metrics-viz slides, a timeline if there's any chronology, a table for financial/KPI detail,
a matrix-2x2 if there's a strategic framework, and closes with big-statement or comparison-columns):

{LAYOUTS_SPEC}

Hard rules (violating these breaks the renderer — every slide is a fixed-size 16:9 card with no scrolling):
- SLIDE COUNT: read the ANALYSIS text for an explicit instruction (e.g. "10 slides", "make it 6 slides",
  "a 3 slide deck") and produce EXACTLY that many. If no count is specified, choose the count that best
  fits the content's richness — typically 6 to 10 slides for a dense corporate deck. Never pad with filler
  slides just to hit a number, and never truncate real content to avoid making more slides.
- Title <= 60 characters. Subtitle <= 140 characters. Every bullet/value/label field described in the
  layout spec must fit on ONE line at its slide position — keep every string SHORT; cut words, don't wrap.
- Every stat, bullet, table cell, and chart value must carry a concrete number, metric, or structured
  claim drawn from the ANALYSIS/SOURCE DOCUMENTS — reject vague marketing language. Never invent numbers
  that aren't grounded in the input; if a real number isn't available for a slot, omit that item instead.
- The deck must have a narrative arc: each "transition" sentence should logically hand off to the next
  slide's topic. The last slide usually needs no transition (use "").
- If no brand URL/colors are discoverable, default to primaryHex #0f172a, secondaryHex #475569,
  accentHex #6366f1, headerFont Inter, bodyFont Inter, tone "Modern Corporate Neutral".
- "imageQuery" fields must describe something a stock-photo/encyclopedia search would actually return
  (e.g. "espresso machine barista", "warehouse logistics conveyor") — never an abstract concept like "growth".
- Return ONLY the JSON object, no markdown fences, no commentary.
"""

REVISE_PROMPT = f"""You are SlideCraft AI's revision engine. The user already has a generated deck (given
below as CURRENT_DECK) and is asking for a specific change via chat, optionally attaching NEW_DOCUMENTS.

Apply ONLY the requested change(s) — keep everything else in the deck stable unless the request implies a
broader rework (e.g. "make it 10 slides" means you should add/split slides; "add a slide on X" means insert
one in the right narrative position). Return a single JSON object with this exact shape:

{{
  "reply": "a short (1-3 sentence) conversational confirmation of what you changed",
  "deckTitle": "...",
  "brand": {{ ...same shape as before... }},
  "slides": [ ...same shape as before, full updated slide array... ]
}}

{LAYOUTS_SPEC}

The same hard density/overflow/grounding rules from deck generation still apply — short fields only, real
numbers only, a coherent transition arc, and use the full layout library rather than defaulting to bullets.
Return ONLY the JSON object.
"""


def _call_gemini_json(system_prompt: str, user_prompt: str, api_key: str) -> dict:
    resp = requests.post(
        GEMINI_URL,
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        json={
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        },
        timeout=90,
    )
    resp.raise_for_status()
    data = resp.json()
    parts = data["candidates"][0]["content"]["parts"]
    text = "".join(p.get("text", "") for p in parts)
    return json.loads(text)


def _enrich_slides_with_visuals(slides):
    for slide in slides:
        d = slide.get("data") or {}
        query = d.get("imageQuery")
        if slide.get("layout") in ("photo-feature", "bullet-panels") and query:
            d["imageUrl"] = search_free_image(query)
        slide["data"] = d
    return slides


def extract_brand_and_plan(analysis_text: str, source_text: str, url: str, api_key: str):
    prompt = (
        f"ANALYSIS:\n{analysis_text}\n\n"
        f"SOURCE DOCUMENTS:\n{source_text or '(none provided)'}\n\n"
        f"COMPANY URL:\n{url or '(none provided)'}"
    )
    parsed = _call_gemini_json(EXTRACTION_PROMPT, prompt, api_key)

    brand = {**DEFAULT_BRAND, **(parsed.get("brand") or {})}
    slides = parsed.get("slides") or []
    if len(slides) < 1:
        raise ValueError("Gemini returned no slides")
    _enrich_slides_with_visuals(slides)
    deck_title = parsed.get("deckTitle") or (slides[0].get("title") if slides else "Untitled deck")
    return brand, slides, deck_title


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def _run_canva_pipeline(slides):
    canva = {"connected": is_connected(), "mode": None, "templates": [], "design": None, "warning": None}

    if not is_connected():
        canva["warning"] = "Canva isn't connected yet — showing the brand guide and slide plan only. Connect Canva to generate the actual deck."
        return canva

    try:
        templates = list_brand_templates()
    except requests.RequestException as e:
        canva["warning"] = f"Couldn't reach Canva's Brand Template API: {e}"
        return canva

    if not templates:
        try:
            design = create_blank_presentation(f"SlideCraft AI — {slides[0]['title']}")
            canva["mode"] = "fallback_blank_presentation"
            canva["design"] = design
            canva["warning"] = (
                "Your Canva account has no Brand Templates (Brand Templates are an Enterprise/Teams "
                "governance feature, not part of individual Canva Pro) — created a blank presentation "
                "design instead, matched to your brand colors below. Finish it in Canva."
            )
        except requests.RequestException as e:
            canva["warning"] = f"No Brand Templates found, and the fallback design create failed: {e}"
        return canva

    chosen = templates[:3]
    canva["templates"] = [{"id": t.get("id"), "title": t.get("title")} for t in chosen]

    primary_template = chosen[0]
    try:
        dataset = get_brand_template_dataset(primary_template["id"])
    except requests.RequestException as e:
        canva["warning"] = f"Couldn't fetch the template's autofill schema: {e}"
        return canva

    if not dataset:
        try:
            design = create_blank_presentation(f"SlideCraft AI — {slides[0]['title']}")
            canva["mode"] = "fallback_blank_presentation"
            canva["design"] = design
            canva["warning"] = "The selected Brand Template exposes no autofillable fields — created a blank presentation instead."
        except requests.RequestException as e:
            canva["warning"] = f"Empty template schema, and fallback design create failed: {e}"
        return canva

    data = _map_slide_to_dataset_fields(dataset, slides[0])
    try:
        job = create_autofill_job(primary_template["id"], slides[0]["title"], data)
        final_job = poll_autofill_job(job["id"])
    except requests.RequestException as e:
        canva["warning"] = f"Autofill request failed: {e}"
        return canva

    canva["mode"] = "brand_template_autofill"
    canva["job"] = final_job
    if final_job.get("status") == "success":
        canva["design"] = final_job["result"]["design"]
    else:
        canva["warning"] = f"Autofill job ended with status: {final_job.get('status')}"

    return canva


def generate_deck(session_id: str, analysis_text: str, source_text: str, url: str, api_key: str):
    merged_source = "\n\n".join(filter(None, [source_text, _uploads_as_text(session_id)]))
    brand, slides, deck_title = extract_brand_and_plan(analysis_text, merged_source, url, api_key)
    canva = _run_canva_pipeline(slides)

    deck = {
        "analysisText": analysis_text,
        "sourceText": source_text,
        "url": url,
        "deckTitle": deck_title,
        "logoUrl": get_domain_logo(url),
        "brand": brand,
        "slides": slides,
        "canva": canva,
        "chatHistory": [],
    }
    DECKS[session_id] = deck
    return deck


def get_deck(session_id: str):
    return DECKS.get(session_id)


def revise_deck(session_id: str, message: str, api_key: str):
    deck = DECKS.get(session_id)
    if not deck:
        raise ValueError("No deck found for this session yet — generate one first.")

    new_docs_text = _uploads_as_text(session_id)
    current = {
        "deckTitle": deck.get("deckTitle"),
        "brand": deck["brand"],
        "slides": [{k: v for k, v in s.items() if k != "data"} | {"data": {k: v for k, v in (s.get("data") or {}).items() if k != "imageUrl"}} for s in deck["slides"]],
    }
    prompt = (
        f"CURRENT_DECK:\n{json.dumps(current)}\n\n"
        f"USER REQUEST:\n{message}\n\n"
        f"NEW_DOCUMENTS:\n{new_docs_text or '(none)'}"
    )
    parsed = _call_gemini_json(REVISE_PROMPT, prompt, api_key)

    brand = {**deck["brand"], **(parsed.get("brand") or {})}
    slides = parsed.get("slides") or deck["slides"]
    if len(slides) < 1:
        raise ValueError("Revision produced no slides")
    _enrich_slides_with_visuals(slides)

    deck["brand"] = brand
    deck["slides"] = slides
    deck["deckTitle"] = parsed.get("deckTitle", deck.get("deckTitle"))
    deck["chatHistory"].append({"role": "user", "text": message})
    deck["chatHistory"].append({"role": "assistant", "text": parsed.get("reply", "Updated the deck.")})
    return deck, parsed.get("reply", "Updated the deck.")


def sync_deck_to_canva(session_id: str):
    deck = DECKS.get(session_id)
    if not deck:
        raise ValueError("No deck found for this session yet — generate one first.")
    deck["canva"] = _run_canva_pipeline(deck["slides"])
    return deck["canva"]
