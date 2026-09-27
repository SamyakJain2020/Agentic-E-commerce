# Aura — Agentic E-Commerce

A full agentic storefront built as a demo of agentic commerce: an LLM shopping agent that searches, negotiates
discounts, and checks out on your behalf; a groceries flow with biometric one-step wallet checkout; a real-time
voice concierge (Sarvam speech-to-text + a Gemini agent with access to order history and preferences); and a
Razorpay Standard Checkout integration for real card/UPI payments.

## Stack

- **Backend:** Python 3.9, Flask, Flask-CORS, `requests`, `razorpay`, Gemini (`gemini-flash-latest`) for the
  agent, Sarvam AI (`saaras:v3`) for speech-to-text.
- **Frontend:** React 19, Vite, Tailwind CSS, `motion` (Framer Motion), `lenis` (smooth scroll),
  `@heroicons/react`, `react-router-dom`.

## Structure

```
backend/
  main.py           Flask app: REST API (products, cart, checkout, orders, agent chat, voice, Razorpay)
  agent.py          Gemini tool-calling agent (shopping + voice personas)
  data.py           In-memory product/order/wallet mock data
  requirements.txt
frontend/
  src/
    pages/          Home, Shop, ProductDetail, Cart, Orders, Groceries, Voice
    components/      Navbar, Footer, ProductCard, AgentChat, BiometricModal, WalletCard, RazorpayButton, Reveal
    context/         CartContext
    lib/             api client, smooth scroll, script loader
```

## Environment variables

Backend (`backend/.env`, never committed):

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
SARVAM_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Frontend (`frontend/.env`, never committed):

```
VITE_RAZORPAY_KEY_ID=
```

## Running locally

```bash
cd backend && pip install -r requirements.txt && python main.py
cd frontend && npm install && npm run dev
```

## Deployment

Deployed on a single EC2 instance running both apps behind one Flask process (HTTP :80 and HTTPS :443 via an
existing Let's Encrypt cert), with the frontend built to static files served by Flask.
