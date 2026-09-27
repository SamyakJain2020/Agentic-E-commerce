import itertools
import random
import time

_id_counter = itertools.count(1)

# Verified-reachable Unsplash photos, grouped by theme. Used instead of random
# stock photos so each product/category shows something actually relevant.
IMAGE_POOLS = {
    "Shirts": ["1596755094514-f87e34085b2c", "1620012253295-c15cc3e65df4", "1602810318383-e386cc2a3ccf",
               "1618354691373-d851c5c3a990", "1622445275576-721325763afe", "1620799140408-edc6dcb6d633",
               "1596993100471-c3905dafa78e", "1489987707025-afc232f7ea0f"],
    "Outerwear": ["1551028719-00167b16eac5", "1544923246-77307dd654cb", "1591047139829-d91aecb6caea",
                  "1521223890158-f9f7c3d5d504", "1544441893-675973e31985", "1608063615781-e2ef8c73d114",
                  "1520975916090-3105956dac38"],
    "Footwear": ["1549298916-b41d501d3772", "1606107557195-0e29a4b5b4aa", "1595950653106-6c9ebd614d3a",
                 "1595341888016-a392ef81b7de", "1560769629-975ec94e6a86", "1600185365483-26d7a4cc7519",
                 "1608231387042-66d1773070a5", "1543163521-1bf539c55dd2"],
    "Accessories": ["1523275335684-37898b6baf30", "1591561954557-26941169b49e", "1509941943102-10c232535736",
                     "1601121141461-9d6647bca1ed", "1526170375885-4d8ecf77b99f", "1611085583191-a3b181a88401",
                     "1622560480605-d83c853bc5c3"],
    "Bags": ["1548036328-c9fa89d128fa", "1553062407-98eeb64c6a62", "1590874103328-eac38a683ce7"],
    "Fruits & Vegetables": ["1610832958506-aa56368176cf", "1571771894821-ce9b6c11b08e",
                             "1619566636858-adf3ef46400b", "1567306226416-28f0efdc88ce", "1519996529931-28324d5a630e"],
    "Dairy & Bakery": ["1550583724-b2692b85b150", "1563636619-e9143da7973b",
                        "1608198093002-ad4e005484ec", "1587049633312-d628ae50a8ae"],
    "Snacks & Beverages": ["1621939514649-280e2ee25f60", "1600952841320-db92ec4047ca", "1621447504864-d8686e12698c"],
}
HERO_IMAGES = ["1445019980597-93fa8acb246c", "1618221195710-dd6b41faaea6", "1600880292203-757bb62b4baf",
               "1521572163474-6864f9cf17ab", "1441986300917-64674bd600d8"]


def _image_url(category, index, w=700, h=900):
    pool = IMAGE_POOLS.get(category) or HERO_IMAGES
    photo_id = pool[index % len(pool)]
    return f"https://images.unsplash.com/photo-{photo_id}?w={w}&h={h}&fit=crop&q=75&auto=format"


CATEGORIES = ["Shirts", "Outerwear", "Footwear", "Accessories", "Bags"]

_ADJ = ["Classic", "Urban", "Heritage", "Everyday", "Premium", "Essential", "Modern", "Coastal"]
_NOUN = {
    "Shirts": ["Striped Shirt", "Oxford Shirt", "Linen Shirt", "Flannel Shirt", "Denim Shirt"],
    "Outerwear": ["Bomber Jacket", "Trench Coat", "Puffer Vest", "Denim Jacket", "Windbreaker"],
    "Footwear": ["Canvas Sneaker", "Leather Boot", "Running Shoe", "Suede Loafer", "Sandal"],
    "Accessories": ["Leather Belt", "Wool Scarf", "Aviator Sunglasses", "Canvas Cap", "Wristwatch"],
    "Bags": ["Weekender Bag", "Leather Backpack", "Tote Bag", "Messenger Bag", "Crossbody Bag"],
}
_COLORS = ["Red", "Navy", "Olive", "Black", "White", "Tan", "Grey", "Burgundy"]

random.seed(42)

PRODUCTS = []
for cat in CATEGORIES:
    cat_index = 0
    for noun in _NOUN[cat]:
        for color in random.sample(_COLORS, 3):
            pid = next(_id_counter)
            price = round(random.uniform(18, 220), 2)
            rating = round(random.uniform(3.6, 5.0), 1)
            reviews = random.randint(12, 480)
            PRODUCTS.append({
                "id": pid,
                "name": f"{random.choice(_ADJ)} {color} {noun}",
                "category": cat,
                "color": color,
                "price": price,
                "rating": rating,
                "reviewCount": reviews,
                "description": (
                    f"A {color.lower()} {noun.lower()} built for everyday wear. "
                    f"Durable materials, a relaxed fit, and finishing details that hold up wash after wash."
                ),
                "image": _image_url(cat, cat_index),
                "inStock": random.random() > 0.08,
                "tags": [cat.lower(), color.lower(), noun.lower().replace(" ", "-")],
            })
            cat_index += 1

GROCERY_CATEGORIES = ["Fruits & Vegetables", "Dairy & Bakery", "Snacks & Beverages"]

_GROCERY_ITEMS = {
    "Fruits & Vegetables": [
        ("Bananas", "1 dozen", 1.49), ("Apples", "1 kg", 2.99), ("Tomatoes", "1 kg", 1.79),
        ("Onions", "1 kg", 1.29), ("Potatoes", "1 kg", 1.19), ("Spinach", "250 g bunch", 1.59),
        ("Carrots", "500 g", 1.39), ("Cucumbers", "500 g", 1.09), ("Oranges", "1 kg", 2.49),
        ("Bell Peppers", "3 pack", 2.79),
    ],
    "Dairy & Bakery": [
        ("Whole Milk", "1 L", 1.89), ("Greek Yogurt", "500 g tub", 3.49), ("Cheddar Cheese", "200 g block", 4.29),
        ("Butter", "250 g", 3.19), ("Eggs", "1 dozen", 3.99), ("White Bread", "400 g loaf", 2.29),
        ("Brown Bread", "400 g loaf", 2.49), ("Paneer", "200 g", 3.79), ("Curd", "400 g cup", 1.99),
        ("Croissants", "4 pack", 3.99),
    ],
    "Snacks & Beverages": [
        ("Potato Chips", "150 g", 2.19), ("Mixed Nuts", "300 g", 5.99), ("Orange Juice", "1 L", 2.99),
        ("Cola", "1.5 L bottle", 1.99), ("Green Tea", "25 bags", 3.49), ("Coffee Beans", "250 g", 6.99),
        ("Chocolate Bar", "100 g", 1.79), ("Granola Bars", "6 pack", 3.29), ("Sparkling Water", "1 L", 1.29),
        ("Instant Noodles", "5 pack", 2.49),
    ],
}

GROCERY_PRODUCTS = []
for cat, items in _GROCERY_ITEMS.items():
    for gi, (name, unit, price) in enumerate(items):
        gid = next(_id_counter)
        GROCERY_PRODUCTS.append({
            "id": gid,
            "name": name,
            "category": cat,
            "unit": unit,
            "color": "",
            "price": price,
            "rating": round(random.uniform(4.0, 5.0), 1),
            "reviewCount": random.randint(30, 900),
            "description": f"{name} — {unit}. Fresh stock, sourced daily.",
            "image": _image_url(cat, gi, w=500, h=500),
            "inStock": random.random() > 0.05,
            "tags": [cat.lower(), name.lower().replace(" ", "-"), "grocery"],
            "isGrocery": True,
        })

PRODUCTS.extend(GROCERY_PRODUCTS)
CATEGORIES.extend(GROCERY_CATEGORIES)

DISCOUNTS = {
    "WELCOME10": 0.10,
    "AGENT15": 0.15,
    "FREESHIP": 0.0,
}

# session_id -> cart list[{productId, qty}]
CARTS = {}

# session_id -> {"balance": float, "reserved": float}
WALLETS = {}
DEFAULT_WALLET_BALANCE = 500.0

# order_id -> order record
ORDERS = {}

USER_PROFILE = {
    "name": "Samyak",
    "dietary": "Vegetarian, avoids excess added sugar",
    "favoriteBrands": ["Amul", "Nestle", "Tata"],
    "usualGroceryList": ["Bananas", "Whole Milk", "Brown Bread", "Eggs", "Spinach", "Greek Yogurt"],
    "paymentPreference": "1-step biometric checkout using wallet balance",
    "notes": "Reorders groceries weekly, usually on Sundays. Prefers fastest delivery slot.",
}


def get_wallet(session_id):
    return WALLETS.setdefault(session_id, {"balance": DEFAULT_WALLET_BALANCE, "reserved": 0.0})


def wallet_available(session_id):
    w = get_wallet(session_id)
    return round(w["balance"] - w["reserved"], 2)


def wallet_topup(session_id, amount):
    w = get_wallet(session_id)
    w["balance"] = round(w["balance"] + float(amount), 2)
    return w


def wallet_reserve(session_id, amount):
    w = get_wallet(session_id)
    if wallet_available(session_id) < amount:
        return False
    w["reserved"] = round(w["reserved"] + amount, 2)
    return True


def wallet_capture(session_id, amount):
    w = get_wallet(session_id)
    w["reserved"] = round(max(0, w["reserved"] - amount), 2)
    w["balance"] = round(w["balance"] - amount, 2)
    return w


def wallet_release(session_id, amount):
    w = get_wallet(session_id)
    w["reserved"] = round(max(0, w["reserved"] - amount), 2)
    return w

_STAGES = ["Processing", "Packed", "Shipped", "Out for delivery", "Delivered"]


def seed_demo_orders():
    now = time.time()
    demo = [
        {
            "orderId": "ORD-10021",
            "items": [{"productId": PRODUCTS[0]["id"], "qty": 1, "name": PRODUCTS[0]["name"], "price": PRODUCTS[0]["price"]}],
            "status": "Shipped",
            "placedAt": now - 3 * 86400,
            "carrier": "BlueDart",
            "trackingId": "BD48291002",
            "eta": "2 days",
            "history": [
                {"stage": "Processing", "at": now - 3 * 86400},
                {"stage": "Packed", "at": now - 2.5 * 86400},
                {"stage": "Shipped", "at": now - 1.5 * 86400},
            ],
            "address": "221B Residency Road, Bengaluru",
        },
        {
            "orderId": "ORD-10008",
            "items": [{"productId": PRODUCTS[5]["id"], "qty": 2, "name": PRODUCTS[5]["name"], "price": PRODUCTS[5]["price"]}],
            "status": "Delivered",
            "placedAt": now - 9 * 86400,
            "carrier": "Delhivery",
            "trackingId": "DL99213410",
            "eta": "Delivered",
            "history": [
                {"stage": "Processing", "at": now - 9 * 86400},
                {"stage": "Packed", "at": now - 8.5 * 86400},
                {"stage": "Shipped", "at": now - 7 * 86400},
                {"stage": "Out for delivery", "at": now - 6.2 * 86400},
                {"stage": "Delivered", "at": now - 6 * 86400},
            ],
            "address": "221B Residency Road, Bengaluru",
        },
    ]
    for o in demo:
        ORDERS[o["orderId"]] = o


seed_demo_orders()


def get_cart(session_id):
    return CARTS.setdefault(session_id, [])


def product_by_id(pid):
    return next((p for p in PRODUCTS if p["id"] == int(pid)), None)


def _build_order(session_id, discount_code=None, payment_method="card", is_grocery=False):
    cart = get_cart(session_id)
    if not cart:
        return None, "Cart is empty"
    items = []
    subtotal = 0.0
    for entry in cart:
        p = product_by_id(entry["productId"])
        if not p:
            continue
        line_total = p["price"] * entry["qty"]
        subtotal += line_total
        items.append({"productId": p["id"], "name": p["name"], "price": p["price"], "qty": entry["qty"]})
    discount_rate = DISCOUNTS.get((discount_code or "").upper(), 0)
    discount_amount = round(subtotal * discount_rate, 2)
    total = round(subtotal - discount_amount, 2)
    order_id = f"ORD-{random.randint(20000, 29999)}"
    now = time.time()
    order = {
        "orderId": order_id,
        "items": items,
        "subtotal": round(subtotal, 2),
        "discountCode": discount_code,
        "discountAmount": discount_amount,
        "total": total,
        "status": "Processing",
        "placedAt": now,
        "carrier": random.choice(["BlueDart", "Delhivery", "DTDC", "Ekart"]),
        "trackingId": f"TRK{random.randint(10000000, 99999999)}",
        "eta": "45-60 minutes" if is_grocery else f"{random.randint(2, 6)} days",
        "history": [{"stage": "Processing", "at": now}],
        "address": "221B Residency Road, Bengaluru",
        "paymentMethod": payment_method,
        "isGrocery": is_grocery,
    }
    return order, cart, total


def create_order(session_id, discount_code=None):
    built = _build_order(session_id, discount_code)
    if built[0] is None:
        return None, built[1]
    order, _, _ = built
    ORDERS[order["orderId"]] = order
    CARTS[session_id] = []
    return order, None


def create_order_biometric(session_id, discount_code=None):
    """1-step checkout: reserve + immediately capture from the session's wallet."""
    built = _build_order(session_id, discount_code, payment_method="biometric-1step", is_grocery=True)
    if built[0] is None:
        return None, built[1]
    order, _, total = built
    if not wallet_reserve(session_id, total):
        return None, f"Insufficient wallet balance. Available: ${wallet_available(session_id):.2f}, need ${total:.2f}"
    wallet_capture(session_id, total)
    order["confirmedViaBiometric"] = True
    ORDERS[order["orderId"]] = order
    CARTS[session_id] = []
    return order, None
