import hashlib
import hmac
import os
import threading
import urllib.parse
import uuid
import razorpay
import requests as pyrequests
from flask import Flask, jsonify, redirect, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

import data
import agent
import slidecraft

RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

DIST_DIR = '/opt/app/frontend/dist'
PORTFOLIO_DIST_DIR = '/opt/app/portfolio/dist'
SLIDECRAFT_DIST_DIR = '/opt/app/slidecraft/dist'
app = Flask(__name__, static_folder=None)
CORS(app)

# session_id -> gemini conversation history (list of {role, parts})
SESSIONS = {}
VOICE_SESSIONS = {}

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


@app.route('/health')
def health():
    return jsonify({"status": "healthy", "service": "agentic-shop", "agentReady": bool(os.environ.get("GEMINI_API_KEY"))})


@app.route('/api/products')
def list_products():
    category = request.args.get('category')
    q = (request.args.get('q') or '').lower().strip()
    results = data.PRODUCTS
    if category and category.lower() != 'all':
        results = [p for p in results if p['category'].lower() == category.lower()]
    if q:
        results = [p for p in results if q in p['name'].lower() or q in p['description'].lower()]
    return jsonify({"products": results, "categories": data.CATEGORIES})


@app.route('/api/products/<int:product_id>')
def get_product(product_id):
    p = data.product_by_id(product_id)
    if not p:
        return jsonify({"error": "not found"}), 404
    return jsonify(p)


def _session_id():
    sid = request.headers.get('X-Session-Id') or request.cookies.get('session_id')
    return sid or str(uuid.uuid4())


@app.route('/api/cart', methods=['GET'])
def get_cart():
    sid = _session_id()
    return jsonify(agent._cart_summary(sid))


@app.route('/api/cart/items', methods=['POST'])
def add_cart_item():
    sid = _session_id()
    body = request.get_json(force=True)
    cart = data.get_cart(sid)
    pid = int(body.get('productId'))
    qty = int(body.get('qty', 1))
    existing = next((c for c in cart if c['productId'] == pid), None)
    if existing:
        existing['qty'] += qty
    else:
        cart.append({'productId': pid, 'qty': qty})
    return jsonify(agent._cart_summary(sid))


@app.route('/api/cart/items/<int:product_id>', methods=['DELETE'])
def remove_cart_item(product_id):
    sid = _session_id()
    cart = data.get_cart(sid)
    data.CARTS[sid] = [c for c in cart if c['productId'] != product_id]
    return jsonify(agent._cart_summary(sid))


@app.route('/api/checkout', methods=['POST'])
def checkout():
    sid = _session_id()
    body = request.get_json(silent=True) or {}
    order, err = data.create_order(sid, body.get('discountCode'))
    if err:
        return jsonify({"error": err}), 400
    return jsonify({"order": order})


@app.route('/api/create-order', methods=['POST'])
def razorpay_create_order():
    if not razorpay_client:
        return jsonify({"error": "Razorpay isn't configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)."}), 500

    body = request.get_json(silent=True) or {}
    try:
        amount = int(body.get('amount', 0))
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be an integer (paise)"}), 400
    if amount < 100:
        return jsonify({"error": "amount must be at least 100 paise (₹1)"}), 400

    currency = body.get('currency', 'INR')
    receipt = body.get('receipt') or f"rcpt_{uuid.uuid4().hex[:12]}"

    try:
        order = razorpay_client.order.create({
            "amount": amount,
            "currency": currency,
            "receipt": receipt,
        })
    except Exception as e:
        message = str(e)
        lowered = message.lower()
        if 'authentication' in lowered or 'key_id' in lowered or 'unauthorized' in lowered:
            status = 401
        elif 'bad request' in lowered or 'invalid' in lowered:
            status = 400
        else:
            status = 500
        return jsonify({"error": message}), status

    return jsonify({
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": RAZORPAY_KEY_ID,
    })


@app.route('/api/verify-payment', methods=['POST'])
def razorpay_verify_payment():
    if not RAZORPAY_KEY_SECRET:
        return jsonify({"error": "Razorpay isn't configured (missing RAZORPAY_KEY_SECRET)."}), 500

    body = request.get_json(silent=True) or {}
    order_id = body.get('razorpay_order_id')
    payment_id = body.get('razorpay_payment_id')
    signature = body.get('razorpay_signature')
    if not order_id or not payment_id or not signature:
        return jsonify({"error": "razorpay_order_id, razorpay_payment_id and razorpay_signature are required"}), 400

    payload = f"{order_id}|{payment_id}".encode()
    expected_signature = hmac.new(RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        return jsonify({"success": False, "error": "Signature mismatch — payment not verified."}), 400

    sid = _session_id()
    order, err = data.create_order(sid, body.get('discountCode'))
    if err:
        # Payment was verified but the cart was already empty/stale — still report success
        # since the money was genuinely captured and signature-verified.
        return jsonify({"success": True, "order": None, "warning": err})

    order['paymentMethod'] = 'razorpay'
    order['razorpayOrderId'] = order_id
    order['razorpayPaymentId'] = payment_id
    return jsonify({"success": True, "order": order})


@app.route('/api/orders/<order_id>')
def get_order(order_id):
    order = data.ORDERS.get(order_id.upper())
    if not order:
        return jsonify({"error": "not found"}), 404
    return jsonify(order)


@app.route('/api/orders')
def recent_orders():
    return jsonify({"orders": list(data.ORDERS.values())[-10:]})


@app.route('/api/agent/chat', methods=['POST'])
def agent_chat():
    body = request.get_json(force=True)
    message = (body.get('message') or '').strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    sid = _session_id()
    history = SESSIONS.get(sid, [])
    result = agent.chat(sid, message, history)
    SESSIONS[sid] = result.pop('history', history)
    result['sessionId'] = sid
    return jsonify(result)


# ---------- Groceries ----------

@app.route('/api/groceries')
def list_groceries():
    results = [p for p in data.PRODUCTS if p.get('isGrocery')]
    return jsonify({"products": results, "categories": data.GROCERY_CATEGORIES})


# ---------- Wallet (reserve-then-capture, backs the 1-step biometric checkout) ----------

@app.route('/api/wallet')
def get_wallet():
    sid = _session_id()
    w = data.get_wallet(sid)
    return jsonify({"balance": w["balance"], "reserved": w["reserved"], "available": data.wallet_available(sid)})


@app.route('/api/wallet/topup', methods=['POST'])
def topup_wallet():
    sid = _session_id()
    body = request.get_json(force=True)
    amount = float(body.get('amount', 0))
    if amount <= 0:
        return jsonify({"error": "amount must be positive"}), 400
    w = data.wallet_topup(sid, amount)
    return jsonify({"balance": w["balance"], "reserved": w["reserved"], "available": data.wallet_available(sid)})


@app.route('/api/checkout/biometric', methods=['POST'])
def biometric_checkout():
    """1-step checkout: client confirms a (simulated) biometric prompt, we reserve + capture from the wallet instantly."""
    sid = _session_id()
    body = request.get_json(silent=True) or {}
    if not body.get('biometricConfirmed'):
        return jsonify({"error": "biometric confirmation required"}), 400
    order, err = data.create_order_biometric(sid, body.get('discountCode'))
    if err:
        return jsonify({"error": err}), 400
    w = data.get_wallet(sid)
    return jsonify({"order": order, "wallet": {"balance": w["balance"], "reserved": w["reserved"], "available": data.wallet_available(sid)}})


# ---------- Profile (used by the voice concierge flow) ----------

@app.route('/api/profile')
def get_profile():
    return jsonify({"profile": data.USER_PROFILE, "recentOrders": list(data.ORDERS.values())[-5:]})


# ---------- Voice: Sarvam speech-to-text + Ava voice concierge ----------

@app.route('/api/voice/transcribe', methods=['POST'])
def voice_transcribe():
    api_key = os.environ.get('SARVAM_API_KEY')
    if not api_key:
        return jsonify({"error": "Voice transcription isn't configured (missing SARVAM_API_KEY)."}), 500
    if 'audio' not in request.files:
        return jsonify({"error": "audio file is required"}), 400
    f = request.files['audio']
    try:
        resp = pyrequests.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": api_key},
            files={"file": (f.filename or "audio.webm", f.stream, f.mimetype or "audio/webm")},
            data={"model": "saaras:v3", "language_code": "unknown"},
            timeout=30,
        )
        resp.raise_for_status()
        payload = resp.json()
    except pyrequests.RequestException as e:
        return jsonify({"error": f"Transcription failed: {e}"}), 502
    return jsonify({"transcript": payload.get("transcript", ""), "languageCode": payload.get("language_code")})


@app.route('/api/voice/chat', methods=['POST'])
def voice_chat():
    body = request.get_json(force=True)
    message = (body.get('message') or '').strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    sid = _session_id()
    history = VOICE_SESSIONS.get(sid, [])
    result = agent.chat(sid, message, history, persona="voice")
    VOICE_SESSIONS[sid] = result.pop('history', history)
    result['sessionId'] = sid
    return jsonify(result)


# ---------- SlideCraft AI: Canva OAuth + deck generation ----------

CANVA_REDIRECT_URI = 'https://samyak-jain.tech/api/slidecraft/auth/callback'


@app.route('/api/slidecraft/auth/start')
def slidecraft_auth_start():
    if not slidecraft.CANVA_CLIENT_ID:
        return jsonify({"error": "Canva isn't configured (missing CANVA_CLIENT_ID)."}), 500
    url = slidecraft.build_authorize_url(CANVA_REDIRECT_URI)
    return redirect(url)


@app.route('/api/slidecraft/auth/callback')
def slidecraft_auth_callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    if error:
        return redirect(f'/slidecraft?canva_error={error}')
    if not code or not state:
        return redirect('/slidecraft?canva_error=missing_code')
    try:
        slidecraft.exchange_code(code, state, CANVA_REDIRECT_URI)
    except Exception as e:
        return redirect(f'/slidecraft?canva_error={urllib.parse.quote(str(e))}')
    return redirect('/slidecraft?canva_connected=1')


@app.route('/api/slidecraft/auth/status')
def slidecraft_auth_status():
    return jsonify({"connected": slidecraft.is_connected(), "configured": bool(slidecraft.CANVA_CLIENT_ID)})


@app.route('/api/slidecraft/upload', methods=['POST'])
def slidecraft_upload():
    sid = _session_id()
    files = request.files.getlist('files')
    if not files:
        return jsonify({"error": "no files uploaded (expected form field 'files')"}), 400
    MAX_FILE_BYTES = 15 * 1024 * 1024
    added = []
    for f in files:
        raw = f.read(MAX_FILE_BYTES + 1)
        if len(raw) > MAX_FILE_BYTES:
            return jsonify({"error": f"{f.filename} is over the 15MB limit"}), 400
        entry = slidecraft.add_upload(sid, f.filename, raw)
        added.append({"filename": entry["filename"], "chars": entry["chars"]})
    return jsonify({"added": added, "uploads": slidecraft.list_uploads(sid)})


@app.route('/api/slidecraft/uploads', methods=['GET'])
def slidecraft_list_uploads():
    sid = _session_id()
    return jsonify({"uploads": slidecraft.list_uploads(sid)})


@app.route('/api/slidecraft/generate', methods=['POST'])
def slidecraft_generate():
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({"error": "Gemini isn't configured (missing GEMINI_API_KEY)."}), 500

    sid = _session_id()
    body = request.get_json(force=True)
    analysis_text = (body.get('analysisText') or '').strip()
    source_text = (body.get('sourceText') or '').strip()
    url = (body.get('url') or '').strip()
    if not analysis_text:
        return jsonify({"error": "analysisText is required"}), 400

    try:
        result = slidecraft.generate_deck(sid, analysis_text, source_text, url, api_key)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify(result)


@app.route('/api/slidecraft/deck', methods=['GET'])
def slidecraft_get_deck():
    sid = _session_id()
    deck = slidecraft.get_deck(sid)
    if not deck:
        return jsonify({"error": "not found"}), 404
    return jsonify(deck)


@app.route('/api/slidecraft/chat', methods=['POST'])
def slidecraft_chat():
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({"error": "Gemini isn't configured (missing GEMINI_API_KEY)."}), 500

    sid = _session_id()
    body = request.get_json(force=True)
    message = (body.get('message') or '').strip()
    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        deck, reply = slidecraft.revise_deck(sid, message, api_key)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"reply": reply, "brand": deck["brand"], "slides": deck["slides"]})


@app.route('/api/slidecraft/canva/sync', methods=['POST'])
def slidecraft_canva_sync():
    sid = _session_id()
    try:
        canva = slidecraft.sync_deck_to_canva(sid)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"canva": canva})


@app.route('/')
def serve_portfolio_root():
    return send_from_directory(PORTFOLIO_DIST_DIR, 'index.html')


@app.route('/<path:path>')
def serve_static_assets(path):
    if path.startswith('api/'):
        return jsonify({"error": "not found"}), 404

    if path == 'aura' or path.startswith('aura/'):
        sub = path[len('aura/'):] if path.startswith('aura/') else ''
        full = os.path.join(DIST_DIR, sub)
        if sub and os.path.isfile(full):
            return send_from_directory(DIST_DIR, sub)
        return send_from_directory(DIST_DIR, 'index.html')

    if path == 'slidecraft' or path.startswith('slidecraft/'):
        sub = path[len('slidecraft/'):] if path.startswith('slidecraft/') else ''
        full = os.path.join(SLIDECRAFT_DIST_DIR, sub)
        if sub and os.path.isfile(full):
            return send_from_directory(SLIDECRAFT_DIST_DIR, sub)
        return send_from_directory(SLIDECRAFT_DIST_DIR, 'index.html')

    full = os.path.join(PORTFOLIO_DIST_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(PORTFOLIO_DIST_DIR, path)
    return send_from_directory(PORTFOLIO_DIST_DIR, 'index.html')


CERT_PATH = '/etc/letsencrypt/live/samyak-jain.tech/fullchain.pem'
KEY_PATH = '/etc/letsencrypt/live/samyak-jain.tech/privkey.pem'

if __name__ == '__main__':
    if os.path.exists(CERT_PATH):
        threading.Thread(target=lambda: app.run(host='0.0.0.0', port=80), daemon=True).start()
        app.run(host='0.0.0.0', port=443, ssl_context=(CERT_PATH, KEY_PATH))
    else:
        app.run(host='0.0.0.0', port=80)
