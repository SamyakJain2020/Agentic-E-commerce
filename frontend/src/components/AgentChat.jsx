import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { api } from '../lib/api'
import { useCart } from '../context/CartContext'

const SUGGESTIONS = [
  'Find a red striped shirt under $30',
  "Where is my order ORD-10021?",
  'Recommend a jacket for cold weather under $150',
  'Apply code AGENT15 and checkout',
]

function ProductMiniCard({ p }) {
  return (
    <Link to={`/product/${p.id}`} className="flex w-40 shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white hover:shadow-md transition">
      <img src={p.image} alt={p.name} className="h-32 w-full object-cover" />
      <div className="p-2">
        <p className="line-clamp-1 text-xs font-medium text-neutral-900">{p.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-neutral-600">${p.price.toFixed(2)}</p>
      </div>
    </Link>
  )
}

function OrderMiniCard({ o }) {
  const stages = ['Processing', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']
  const idx = stages.indexOf(o.status)
  return (
    <div className="w-64 shrink-0 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-neutral-900">{o.orderId}</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{o.status}</span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        {stages.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-indigo-600' : 'bg-neutral-200'}`} />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">{o.carrier} · {o.trackingId}</p>
      <p className="text-[11px] text-neutral-500">ETA: {o.eta}</p>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse-dot" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

export default function AgentChat({ open, onClose }) {
  const { refresh } = useCart()
  const [messages, setMessages] = useState([
    { role: 'agent', text: "Hi, I'm Ava — your shopping agent. Tell me a goal like “find a red striped shirt under $30” or ask about an order, and I'll handle it end-to-end." },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(text) {
    const msg = (text ?? input).trim()
    if (!msg || busy) return
    setMessages((m) => [...m, { role: 'user', text: msg }])
    setInput('')
    setBusy(true)
    try {
      const res = await api.agentChat(msg)
      setMessages((m) => [...m, { role: 'agent', text: res.reply, cards: res.cards, orders: res.orders }])
      if (res.orders?.length || res.reply?.toLowerCase().includes('order placed') || res.reply?.toLowerCase().includes('checkout')) {
        refresh()
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'agent', text: `Something went wrong: ${e.message}` }])
    } finally {
      setBusy(false)
      refresh()
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px] transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 sm:bottom-6 sm:right-6 sm:h-[640px] sm:rounded-2xl sm:border sm:border-neutral-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3.5 sm:rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><SparklesIcon className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold leading-tight">Ava · Shopping Agent</p>
              <p className="text-[11px] text-white/80">Searches, negotiates & checks out for you</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/90 hover:bg-white/10" aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] ${m.role === 'user' ? '' : 'w-full'}`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {m.text}
                </div>
                {m.cards?.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {m.cards.map((p) => <ProductMiniCard key={p.id} p={p} />)}
                  </div>
                )}
                {m.orders?.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {m.orders.map((o) => <OrderMiniCard key={o.orderId} o={o} />)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-neutral-100 px-2"><TypingDots /></div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-indigo-300 hover:text-indigo-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          className="flex items-center gap-2 border-t border-neutral-200 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Ava what you need…"
            className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition disabled:opacity-40"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  )
}
