import os
import json
import time
import requests

import data

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_PROMPT = """You are Ava, an autonomous shopping agent embedded in an e-commerce site.
You can search the catalog, inspect products, apply discount codes, manage the shopper's cart,
place orders, and track existing orders (WISMO: "where is my order").

Rules:
- Always use the provided tools to look up real data instead of guessing prices, stock, or order status.
- When the shopper states a goal (e.g. "find a red striped shirt under $30"), search, narrow down,
  and recommend 1-3 specific products by name and price, then offer to add to cart or checkout.
- Before checkout, confirm the cart contents and total with the shopper unless they already said
  "buy it" / "checkout now" / clearly authorized the purchase in this turn or a previous one.
- For order tracking or returns questions, use track_order / list_recent_orders. Be proactive:
  if the shopper seems worried about a late order, offer a concrete next step (refund, replacement, escalate).
- Keep replies short, warm, and concrete. Never invent product names, prices, or order numbers.
- Prices are in USD.
"""

VOICE_SYSTEM_PROMPT = """You are Ava, a voice shopping concierge for the shopper {name}.
You are speaking with them out loud (their words arrive transcribed, and your reply will be read aloud),
so keep every reply SHORT — 1-3 sentences, no markdown, no bullet lists, no asterisks.

You already know this shopper:
- Dietary notes: {dietary}
- Favorite brands: {brands}
- Usual grocery list: {usual}
- Payment preference: {payment_pref}
- Notes: {notes}

You can see their past orders via list_recent_orders / track_order, and their full saved
preferences via get_preferences. Use this knowledge proactively — e.g. if they say "reorder my usuals",
add their usual grocery list items without asking them to repeat it. If they say "checkout" or "pay",
confirm the total out loud in one short sentence and then call checkout.
Always use tools for real data (prices, stock, cart, orders) instead of guessing.
"""

TOOLS = [{
    "functionDeclarations": [
        {
            "name": "search_products",
            "description": "Search the product catalog by free-text query, category, color, and/or max price.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Free text search, matched against name/description/tags."},
                    "category": {"type": "string", "description": "One of Shirts, Outerwear, Footwear, Accessories, Bags"},
                    "color": {"type": "string"},
                    "max_price": {"type": "number"},
                    "min_rating": {"type": "number"},
                },
            },
        },
        {
            "name": "get_product",
            "description": "Get full details for a single product by id.",
            "parameters": {
                "type": "object",
                "properties": {"product_id": {"type": "integer"}},
                "required": ["product_id"],
            },
        },
        {
            "name": "apply_discount",
            "description": "Validate a discount code and return the discount percentage it grants.",
            "parameters": {
                "type": "object",
                "properties": {"code": {"type": "string"}},
                "required": ["code"],
            },
        },
        {
            "name": "add_to_cart",
            "description": "Add a product to the shopper's cart.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "integer"},
                    "quantity": {"type": "integer"},
                },
                "required": ["product_id"],
            },
        },
        {
            "name": "view_cart",
            "description": "Get the current contents and total of the shopper's cart.",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "checkout",
            "description": "Place an order for everything currently in the cart, optionally applying a discount code. Only call this after the shopper has clearly confirmed they want to buy.",
            "parameters": {
                "type": "object",
                "properties": {"discount_code": {"type": "string"}},
            },
        },
        {
            "name": "track_order",
            "description": "Look up the live shipping status of an order by its order id.",
            "parameters": {
                "type": "object",
                "properties": {"order_id": {"type": "string"}},
                "required": ["order_id"],
            },
        },
        {
            "name": "list_recent_orders",
            "description": "List the shopper's recent orders (use when they ask about 'my orders' or don't know the order id).",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "get_preferences",
            "description": "Get the shopper's saved preferences: dietary notes, favorite brands, usual grocery list, payment preference.",
            "parameters": {"type": "object", "properties": {}},
        },
        {
            "name": "initiate_return",
            "description": "Start a return/refund request for an order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["order_id", "reason"],
            },
        },
    ]
}]


def _serialize_product_card(p):
    return {
        "id": p["id"], "name": p["name"], "price": p["price"], "image": p["image"],
        "rating": p["rating"], "reviewCount": p["reviewCount"], "category": p["category"],
        "color": p["color"], "inStock": p["inStock"],
    }


def run_tool(session_id, name, args, cards, orders_out):
    if name == "search_products":
        results = data.PRODUCTS
        q = (args.get("query") or "").lower().strip()
        if q:
            terms = q.split()
            results = [p for p in results if all(
                t in p["name"].lower() or t in p["description"].lower() or any(t in tag for tag in p["tags"])
                for t in terms
            )]
        if args.get("category"):
            results = [p for p in results if p["category"].lower() == args["category"].lower()]
        if args.get("color"):
            results = [p for p in results if p["color"].lower() == args["color"].lower()]
        if args.get("max_price") is not None:
            results = [p for p in results if p["price"] <= float(args["max_price"])]
        if args.get("min_rating") is not None:
            results = [p for p in results if p["rating"] >= float(args["min_rating"])]
        results = sorted(results, key=lambda p: -p["rating"])[:8]
        cards.extend(_serialize_product_card(p) for p in results)
        return {"count": len(results), "products": [
            {"id": p["id"], "name": p["name"], "price": p["price"], "rating": p["rating"],
             "color": p["color"], "category": p["category"], "inStock": p["inStock"]}
            for p in results
        ]}

    if name == "get_product":
        p = data.product_by_id(args.get("product_id"))
        if not p:
            return {"error": "not found"}
        cards.append(_serialize_product_card(p))
        return p

    if name == "apply_discount":
        code = (args.get("code") or "").upper()
        rate = data.DISCOUNTS.get(code)
        if rate is None:
            return {"valid": False, "message": "That code isn't valid."}
        return {"valid": True, "percent_off": rate * 100}

    if name == "add_to_cart":
        p = data.product_by_id(args.get("product_id"))
        if not p:
            return {"error": "product not found"}
        qty = int(args.get("quantity") or 1)
        cart = data.get_cart(session_id)
        existing = next((c for c in cart if c["productId"] == p["id"]), None)
        if existing:
            existing["qty"] += qty
        else:
            cart.append({"productId": p["id"], "qty": qty})
        return {"cart": _cart_summary(session_id)}

    if name == "view_cart":
        return {"cart": _cart_summary(session_id)}

    if name == "checkout":
        order, err = data.create_order(session_id, args.get("discount_code"))
        if err:
            return {"error": err}
        orders_out.append(order)
        return {"order": order}

    if name == "track_order":
        order = data.ORDERS.get((args.get("order_id") or "").upper())
        if not order:
            return {"error": "No order found with that id."}
        orders_out.append(order)
        return {"order": order}

    if name == "list_recent_orders":
        orders = list(data.ORDERS.values())[-5:]
        orders_out.extend(orders)
        return {"orders": [{"orderId": o["orderId"], "status": o["status"], "total": o.get("total")} for o in orders]}

    if name == "get_preferences":
        return data.USER_PROFILE

    if name == "initiate_return":
        order = data.ORDERS.get((args.get("order_id") or "").upper())
        if not order:
            return {"error": "No order found with that id."}
        order["returnRequested"] = {"reason": args.get("reason"), "at": time.time(), "status": "Approved"}
        orders_out.append(order)
        return {"status": "Return approved", "refundEta": "3-5 business days"}

    return {"error": f"unknown tool {name}"}


def _cart_summary(session_id):
    cart = data.get_cart(session_id)
    items = []
    total = 0.0
    for entry in cart:
        p = data.product_by_id(entry["productId"])
        if not p:
            continue
        items.append({"productId": p["id"], "name": p["name"], "price": p["price"], "qty": entry["qty"]})
        total += p["price"] * entry["qty"]
    return {"items": items, "total": round(total, 2)}


def _call_gemini(api_key, contents, system_prompt):
    resp = requests.post(
        GEMINI_URL,
        headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
        json={
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "tools": TOOLS,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def _voice_prompt():
    p = data.USER_PROFILE
    return VOICE_SYSTEM_PROMPT.format(
        name=p["name"], dietary=p["dietary"], brands=", ".join(p["favoriteBrands"]),
        usual=", ".join(p["usualGroceryList"]), payment_pref=p["paymentPreference"], notes=p["notes"],
    )


def chat(session_id, message, history, persona="shopping"):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"reply": "The agent isn't configured yet (missing GEMINI_API_KEY on the server).", "cards": [], "orders": []}

    system_prompt = _voice_prompt() if persona == "voice" else SYSTEM_PROMPT
    contents = list(history) + [{"role": "user", "parts": [{"text": message}]}]
    cards, orders_out = [], []

    for _ in range(6):
        try:
            data_resp = _call_gemini(api_key, contents, system_prompt)
        except requests.RequestException as e:
            return {"reply": f"Sorry, I couldn't reach the reasoning service right now ({e}).", "cards": cards, "orders": orders_out}

        candidates = data_resp.get("candidates") or []
        if not candidates:
            return {"reply": "I didn't get a response — could you rephrase that?", "cards": cards, "orders": orders_out}

        parts = candidates[0].get("content", {}).get("parts", [])
        function_calls = [p["functionCall"] for p in parts if "functionCall" in p]

        if not function_calls:
            text = "".join(p.get("text", "") for p in parts).strip()
            contents.append({"role": "model", "parts": parts})
            return {"reply": text or "Done.", "cards": _dedupe(cards, "id"), "orders": _dedupe(orders_out, "orderId"), "history": contents}

        contents.append({"role": "model", "parts": parts})
        response_parts = []
        for fc in function_calls:
            name = fc.get("name")
            args = fc.get("args") or {}
            result = run_tool(session_id, name, args, cards, orders_out)
            response_parts.append({"functionResponse": {"name": name, "response": result}})
        contents.append({"role": "user", "parts": response_parts})

    return {"reply": "I ran into trouble finishing that request — could you try again?", "cards": _dedupe(cards, "id"), "orders": _dedupe(orders_out, "orderId"), "history": contents}


def _dedupe(items, key):
    seen = set()
    out = []
    for item in items:
        k = item.get(key)
        if k in seen:
            continue
        seen.add(k)
        out.append(item)
    return out
