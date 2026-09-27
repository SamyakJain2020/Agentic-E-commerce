import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftIcon, SwatchIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon,
  ExclamationTriangleIcon, LinkIcon,
} from '@heroicons/react/24/outline'
import { api } from '../api'
import SlideViewer from '../components/SlideViewer'
import ChatPanel from '../components/ChatPanel'

export default function Deck() {
  const [deck, setDeck] = useState(null)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    api.getDeck().then(setDeck).catch(() => setError('No deck yet — generate one first.'))
  }, [])

  function onDeckUpdate(partial) {
    setDeck((d) => ({ ...d, ...partial }))
  }

  async function syncCanva() {
    setSyncing(true)
    try {
      const res = await api.syncCanva()
      setDeck((d) => ({ ...d, canva: res.canva }))
    } catch (e) {
      setDeck((d) => ({ ...d, canva: { ...d.canva, warning: e.message } }))
    } finally {
      setSyncing(false)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4 text-center text-white">
        <p className="text-white/60">{error}</p>
        <Link to="/" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink">Back to generator</Link>
      </div>
    )
  }
  if (!deck) {
    return <div className="flex min-h-screen items-center justify-center bg-ink text-white/40">Loading your deck…</div>
  }

  const canva = deck.canva

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" /> New deck
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70">
            <SwatchIcon className="h-3.5 w-3.5" style={{ color: deck.brand.accentHex }} /> {deck.brand.tone}
          </span>
          {canva.design ? (
            <a
              href={canva.design.urls?.edit_url || canva.design.url}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink"
            >
              Open in Canva <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </a>
          ) : canva.connected ? (
            <button
              onClick={syncCanva}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Push to Canva'}
            </button>
          ) : (
            <a href="/api/slidecraft/auth/start" className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white">
              <LinkIcon className="h-3.5 w-3.5" /> Connect Canva
            </a>
          )}
        </div>
      </header>

      {canva.warning && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200 sm:mx-6">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" /> {canva.warning}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:py-8">
        <div className="min-w-0 flex-1">
          <SlideViewer slides={deck.slides} brand={deck.brand} deckTitle={deck.deckTitle} logoUrl={deck.logoUrl} />
        </div>
        <div className="h-[480px] w-full shrink-0 lg:h-auto lg:w-96">
          <ChatPanel onDeckUpdate={onDeckUpdate} />
        </div>
      </main>
    </div>
  )
}
