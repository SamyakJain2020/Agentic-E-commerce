import { useEffect, useRef, useState } from 'react'
import { PaperAirplaneIcon, SparklesIcon, PaperClipIcon } from '@heroicons/react/24/solid'
import { api } from '../api'
import FileUpload from './FileUpload'

export default function ChatPanel({ onDeckUpdate }) {
  const [messages, setMessages] = useState([
    { role: 'agent', text: "This is your deck. Ask me to tighten a title, swap a visual, add a slide, or paste more context — I'll revise it live." },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploads, setUploads] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    api.listUploads().then((d) => setUploads(d.uploads)).catch(() => {})
  }, [])

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
      const res = await api.chat(msg)
      setMessages((m) => [...m, { role: 'agent', text: res.reply }])
      onDeckUpdate({ brand: res.brand, slides: res.slides, deckTitle: res.deckTitle })
    } catch (e) {
      setMessages((m) => [...m, { role: 'agent', text: `Sorry, that failed: ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500">
          <SparklesIcon className="h-3.5 w-3.5 text-white" />
        </span>
        <p className="text-sm font-semibold text-white">Revise with SlideCraft AI</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === 'user' ? 'bg-white text-ink' : 'bg-white/10 text-white/90'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-white/10 px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/50" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="border-t border-white/10 p-3">
          <FileUpload uploads={uploads} setUploads={setUploads} compact />
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex items-center gap-2 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setShowUpload((s) => !s)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${showUpload ? 'bg-violet-500/30 text-violet-200' : 'bg-white/10 text-white/60 hover:text-white'}`}
          aria-label="Attach documents"
        >
          <PaperClipIcon className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Add a slide on Q4 targets…"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-white disabled:opacity-40"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
