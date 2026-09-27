import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SparklesIcon, LinkIcon, CheckCircleIcon, ExclamationTriangleIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { api } from '../api'
import FileUpload from '../components/FileUpload'

const STAGES = [
  'Extracting brand identity with Gemini Pro',
  'Planning the narrative arc',
  'Sourcing free images per slide',
  'Searching Canva Pro brand templates',
]

const SAMPLE_ANALYSIS = `Q3 review for a DTC coffee subscription brand. Revenue grew 18% QoQ to $2.4M, driven by a 32% jump in
repeat subscribers, but CAC rose to $46 (up from $31) due to paid social saturation. Churn sits at 6.2%/month,
concentrated in the first 2 billing cycles. Competitor X undercuts on price by ~15% but has weaker retention (4.1
month avg LTV vs our 7.3 months). Recommend: shift 20% of paid social budget to referral/loyalty, and add a
2nd-month win-back flow.`

export default function Home() {
  const navigate = useNavigate()
  const [connected, setConnected] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [analysisText, setAnalysisText] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [url, setUrl] = useState('')
  const [uploads, setUploads] = useState([])
  const [busy, setBusy] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [error, setError] = useState(null)
  const stageTimer = useRef(null)

  useEffect(() => {
    api.authStatus().then((s) => { setConnected(s.connected); setConfigured(s.configured) }).catch(() => {})
    api.listUploads().then((d) => setUploads(d.uploads)).catch(() => {})
    const params = new URLSearchParams(window.location.search)
    if (params.get('canva_connected')) {
      setConnected(true)
      window.history.replaceState({}, '', '/slidecraft')
    }
    if (params.get('canva_error')) {
      setError(`Canva connection failed: ${params.get('canva_error')}`)
      window.history.replaceState({}, '', '/slidecraft')
    }
  }, [])

  async function generate() {
    if (!analysisText.trim()) {
      setError('Paste in your analysis first — that’s the one required field.')
      return
    }
    setError(null)
    setBusy(true)
    setStageIdx(0)
    stageTimer.current = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1))
    }, 2200)

    try {
      await api.generate({ analysisText, sourceText, url })
      navigate('/deck')
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(stageTimer.current)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-8">
        <a href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white">S</span>
          <span className="truncate font-display text-lg font-semibold text-white">SlideCraft AI</span>
        </a>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <CheckCircleIcon className="h-4 w-4" /> Canva connected
            </span>
          ) : (
            <a
              href="/api/slidecraft/auth/start"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition ${configured ? 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90' : 'pointer-events-none bg-white/10 opacity-50'}`}
            >
              <LinkIcon className="h-4 w-4" /> Connect Canva
            </a>
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-violet-200">
            <SparklesIcon className="h-3.5 w-3.5" /> Gemini Pro + Canva Pro
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-white sm:text-4xl">
            Raw analysis in. A brand-aligned deck out.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/60">
            Paste your analysis, drop in source documents, and Gemini builds a dense, information-heavy deck —
            KPI grids, tables, timelines, matrices, charts — editable live in chat, and pushed to Canva.
            Say how many slides you want in the analysis text (e.g. "make it 8 slides") — defaults to
            whatever the content supports if you don't specify.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          <div>
            <label className="text-xs font-medium text-white/50">Analysis <span className="text-fuchsia-400">*</span></label>
            <textarea
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              placeholder={SAMPLE_ANALYSIS}
              rows={6}
              className="mt-1.5 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-400"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="text-xs font-medium text-white/50">Source documents (optional)</label>
              <div className="mt-1.5">
                <FileUpload uploads={uploads} setUploads={setUploads} />
              </div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="…or paste text directly"
                rows={3}
                className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-400"
              />
            </div>
            <div className="min-w-0">
              <label className="text-xs font-medium text-white/50">Company URL (optional — for brand cues)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-400"
              />
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
                <DocumentTextIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                No brand signal found? We default to a modern corporate neutral palette (Navy/Slate/White) and Inter.
              </p>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:opacity-50 sm:w-fit"
          >
            <SparklesIcon className="h-4 w-4" />
            {busy ? STAGES[stageIdx] : 'Generate deck'}
          </button>
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-400">
              <ExclamationTriangleIcon className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
