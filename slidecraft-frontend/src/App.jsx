import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  SparklesIcon, LinkIcon, CheckCircleIcon, ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon, SwatchIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { api } from './api'

const STAGES = [
  'Extracting brand identity with Gemini Pro',
  'Planning the narrative arc',
  'Searching Canva Pro brand templates',
  'Autofilling your deck',
]

const SAMPLE_ANALYSIS = `Q3 review for a DTC coffee subscription brand. Revenue grew 18% QoQ to $2.4M, driven by a 32% jump in
repeat subscribers, but CAC rose to $46 (up from $31) due to paid social saturation. Churn sits at 6.2%/month,
concentrated in the first 2 billing cycles. Competitor X undercuts on price by ~15% but has weaker retention (4.1
month avg LTV vs our 7.3 months). Recommend: shift 20% of paid social budget to referral/loyalty, and add a
2nd-month win-back flow.`

function ColorSwatch({ hex, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="h-12 w-12 rounded-xl border border-white/10 shadow-inner" style={{ background: hex }} />
      <p className="text-[11px] font-medium text-white/70">{label}</p>
      <p className="text-[10px] text-white/40">{hex}</p>
    </div>
  )
}

function SlideCard({ slide, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60">Slide {index + 1}</span>
        <span className="truncate rounded-full bg-fuchsia-500/15 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300">{slide.visual}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-white">{slide.title}</h3>
      <p className="mt-1.5 text-sm text-white/60">{slide.takeaway}</p>
      <ul className="mt-3 space-y-1.5">
        {(slide.bullets || []).map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-white/80">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
            <span className="break-words">{b}</span>
          </li>
        ))}
      </ul>
      {slide.speakerNotes && (
        <p className="mt-4 border-t border-white/10 pt-3 text-xs italic leading-relaxed text-white/40">{slide.speakerNotes}</p>
      )}
    </motion.div>
  )
}

export default function App() {
  const [connected, setConnected] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [analysisText, setAnalysisText] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const stageTimer = useRef(null)

  useEffect(() => {
    api.authStatus().then((s) => { setConnected(s.connected); setConfigured(s.configured) }).catch(() => {})
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
    setResult(null)
    setBusy(true)
    setStageIdx(0)
    stageTimer.current = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1))
    }, 1700)

    try {
      const res = await api.generate({ analysisText, sourceText, url })
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(stageTimer.current)
      setBusy(false)
    }
  }

  const canva = result?.canva

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
            Paste your analysis and source material. Gemini extracts the brand identity and builds a dense,
            2–5 slide narrative; Canva's Brand Templates (or a matched fallback) turn it into an editable deck.
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
              <label className="text-xs font-medium text-white/50">Source documents (optional — paste text)</label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste excerpts from reports, transcripts, memos…"
                rows={4}
                className="mt-1.5 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-400"
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

        <AnimatePresence>
          {busy && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 flex flex-col gap-2">
              {STAGES.map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <span className={`h-1.5 w-1.5 rounded-full ${i <= stageIdx ? 'bg-cyan-400' : 'bg-white/15'}`} />
                  <span className={i <= stageIdx ? 'text-white' : 'text-white/30'}>{s}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {result && (
          <div className="mt-12 space-y-10 animate-fade-in">
            <section>
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <SwatchIcon className="h-5 w-5 text-cyan-400" /> Brand UI guidelines
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex gap-4">
                  <ColorSwatch hex={result.brand.primaryHex} label="Primary" />
                  <ColorSwatch hex={result.brand.secondaryHex} label="Secondary" />
                  <ColorSwatch hex={result.brand.accentHex} label="Accent" />
                </div>
                <div className="min-w-0 flex-1 text-sm text-white/70">
                  <p><span className="text-white/40">Header font</span> · {result.brand.headerFont}</p>
                  <p><span className="text-white/40">Body font</span> · {result.brand.bodyFont}</p>
                  <p><span className="text-white/40">Tone</span> · {result.brand.tone}</p>
                  <p><span className="text-white/40">Aesthetic</span> · {result.brand.aesthetic}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-white">Slide plan ({result.slides.length} slides)</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {result.slides.map((s, i) => <SlideCard key={i} slide={s} index={i} />)}
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-white">Canva output</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {canva.warning && (
                  <p className="flex items-start gap-2 rounded-xl bg-amber-400/10 px-3.5 py-2.5 text-sm text-amber-200">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" /> {canva.warning}
                  </p>
                )}
                {canva.templates?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canva.templates.map((t) => (
                      <span key={t.id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{t.title || t.id}</span>
                    ))}
                  </div>
                )}
                {canva.design ? (
                  <a
                    href={canva.design.urls?.edit_url || canva.design.url}
                    target="_blank" rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
                  >
                    Open in Canva <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                ) : !canva.connected ? (
                  <a
                    href="/api/slidecraft/auth/start"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <LinkIcon className="h-4 w-4" /> Connect Canva to generate the deck
                  </a>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
