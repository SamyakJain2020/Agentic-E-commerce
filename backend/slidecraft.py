"""
SlideCraft AI — turns raw analysis + source docs into a brand-aligned slide deck
by combining Gemini Pro (extraction/reasoning) with the Canva Connect API
(OAuth, Brand Template search + autofill).
"""
import base64
import hashlib
import json
import os
import secrets
import time

import requests

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
CANVA_TOKENS = {"access_token": None, "refresh_token": None, "expires_at": 0}

DEFAULT_BRAND = {
    "primaryHex": "#0f172a",
    "secondaryHex": "#475569",
    "accentHex": "#6366f1",
    "headerFont": "Inter",
    "bodyFont": "Inter",
    "tone": "Modern Corporate Neutral",
    "aesthetic": "Minimalist Corporate",
}


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


def _map_slide_to_dataset_fields(dataset: dict, slide: dict):
    """Best-effort mapping: match slide plan fields onto whatever text/image
    fields the chosen brand template's dataset actually exposes."""
    data = {}
    field_names = list(dataset.keys())
    text_fields = [f for f in field_names if dataset[f].get("type") == "text"]

    ordered_values = [slide.get("title", "")]
    ordered_values.append(slide.get("takeaway", ""))
    ordered_values.extend(slide.get("bullets", []))

    for i, field_name in enumerate(text_fields):
        if i < len(ordered_values) and ordered_values[i]:
            data[field_name] = {"type": "text", "text": str(ordered_values[i])[:500]}
    return data


# ---------------------------------------------------------------------------
# Gemini Pro: brand extraction + narrative slide plan
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """You are the analysis engine for SlideCraft AI, a system that turns raw business
analysis into a dense, brand-aligned slide deck (2 to 5 slides).

Given the shopper-provided ANALYSIS, SOURCE DOCUMENTS, and (optionally) a COMPANY URL, produce a single
JSON object with this exact shape:

{
  "brand": {
    "primaryHex": "#RRGGBB",
    "secondaryHex": "#RRGGBB",
    "accentHex": "#RRGGBB",
    "headerFont": "string",
    "bodyFont": "string",
    "tone": "string, e.g. Bold Tech / Minimalist Corporate / Modern Organic",
    "aesthetic": "one short phrase"
  },
  "slides": [
    {
      "title": "Action/insight-driven title, <= 65 chars",
      "takeaway": "one sentence core takeaway",
      "bullets": ["3 to 6 bullets, each with a hard metric or structured point — no generic filler"],
      "visual": "exact visual type, e.g. '2x2 matrix', 'clustered bar chart', 'swimlane diagram'",
      "speakerNotes": "2-3 sentences"
    }
  ]
}

Rules:
- 2 to 5 slides total, never more, never fewer than 2.
- If no brand URL/colors are discoverable, default to primaryHex #0f172a, secondaryHex #475569,
  accentHex #6366f1, headerFont Inter, bodyFont Inter, tone "Modern Corporate Neutral".
- Every bullet must carry a concrete number, metric, or structured claim — reject vague marketing language.
- Return ONLY the JSON object, no markdown fences, no commentary.
"""


def extract_brand_and_plan(analysis_text: str, source_text: str, url: str, api_key: str):
    prompt = (
        f"ANALYSIS:\n{analysis_text}\n\n"
        f"SOURCE DOCUMENTS:\n{source_text or '(none provided)'}\n\n"
        f"COMPANY URL:\n{url or '(none provided)'}"
    )
    resp = requests.post(
        GEMINI_URL,
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        json={
            "system_instruction": {"parts": [{"text": EXTRACTION_PROMPT}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"},
        },
        timeout=45,
    )
    resp.raise_for_status()
    data = resp.json()
    parts = data["candidates"][0]["content"]["parts"]
    text = "".join(p.get("text", "") for p in parts)
    parsed = json.loads(text)

    brand = {**DEFAULT_BRAND, **(parsed.get("brand") or {})}
    slides = (parsed.get("slides") or [])[:5]
    if len(slides) < 2:
        raise ValueError("Gemini returned fewer than 2 slides")
    return brand, slides


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def generate_deck(analysis_text: str, source_text: str, url: str, api_key: str):
    brand, slides = extract_brand_and_plan(analysis_text, source_text, url, api_key)

    result = {
        "brand": brand,
        "slides": slides,
        "canva": {"connected": is_connected(), "mode": None, "templates": [], "design": None, "warning": None},
    }

    if not is_connected():
        result["canva"]["warning"] = "Canva isn't connected yet — showing the brand guide and slide plan only. Connect Canva to generate the actual deck."
        return result

    try:
        templates = list_brand_templates()
    except requests.RequestException as e:
        result["canva"]["warning"] = f"Couldn't reach Canva's Brand Template API: {e}"
        return result

    if not templates:
        # Spec'd fallback: no usable Brand Template dataset -> blank presentation via native engine.
        try:
            design = create_blank_presentation(f"SlideCraft AI — {slides[0]['title']}")
            result["canva"]["mode"] = "fallback_blank_presentation"
            result["canva"]["design"] = design
            result["canva"]["warning"] = (
                "Your Canva account has no Brand Templates (Brand Templates are an Enterprise/Teams "
                "governance feature, not part of individual Canva Pro) — created a blank presentation "
                "design instead, matched to your brand colors below. Finish it in Canva."
            )
        except requests.RequestException as e:
            result["canva"]["warning"] = f"No Brand Templates found, and the fallback design create failed: {e}"
        return result

    chosen = templates[:3]
    result["canva"]["templates"] = [{"id": t.get("id"), "title": t.get("title")} for t in chosen]

    primary_template = chosen[0]
    try:
        dataset = get_brand_template_dataset(primary_template["id"])
    except requests.RequestException as e:
        result["canva"]["warning"] = f"Couldn't fetch the template's autofill schema: {e}"
        return result

    if not dataset:
        try:
            design = create_blank_presentation(f"SlideCraft AI — {slides[0]['title']}")
            result["canva"]["mode"] = "fallback_blank_presentation"
            result["canva"]["design"] = design
            result["canva"]["warning"] = "The selected Brand Template exposes no autofillable fields — created a blank presentation instead."
        except requests.RequestException as e:
            result["canva"]["warning"] = f"Empty template schema, and fallback design create failed: {e}"
        return result

    data = _map_slide_to_dataset_fields(dataset, slides[0])
    try:
        job = create_autofill_job(primary_template["id"], slides[0]["title"], data)
        final_job = poll_autofill_job(job["id"])
    except requests.RequestException as e:
        result["canva"]["warning"] = f"Autofill request failed: {e}"
        return result

    result["canva"]["mode"] = "brand_template_autofill"
    result["canva"]["job"] = final_job
    if final_job.get("status") == "success":
        result["canva"]["design"] = final_job["result"]["design"]
    else:
        result["canva"]["warning"] = f"Autofill job ended with status: {final_job.get('status')}"

    return result
