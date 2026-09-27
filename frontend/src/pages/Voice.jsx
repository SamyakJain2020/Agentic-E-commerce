import { useEffect, useRef, useState, useCallback } from 'react'
import { useMotionValue } from 'motion/react'
import { PhoneXMarkIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid'
import VoiceOrb from '../components/VoiceOrb'
import BiometricModal from '../components/BiometricModal'
import { api } from '../lib/api'

const START_RMS = 0.045
const CONTINUE_RMS = 0.025
const SILENCE_MS = 800
const MIN_RECORD_MS = 350

const STATUS_LABEL = {
  idle: 'Tap the orb to start talking',
  listening: 'Listening…',
  'user-speaking': 'Listening…',
  transcribing: 'Got it, one sec…',
  thinking: 'Ava is thinking…',
  'ai-speaking': 'Ava is speaking…',
}

function speak(text) {
  return new Promise((resolve) => {
    try {
      if (!window.speechSynthesis) return resolve()
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.03
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    } catch {
      resolve()
    }
  })
}

export default function Voice() {
  const [phase, setPhase] = useState('idle')
  const [profile, setProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [micError, setMicError] = useState(null)
  const [secure, setSecure] = useState(true)
  const [biometric, setBiometric] = useState({ open: false, amount: 0, order: null })

  const level = useMotionValue(0)
  const phaseRef = useRef('idle')
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const lastLoudTsRef = useRef(0)
  const recordStartTsRef = useRef(0)
  const seenOrderIdsRef = useRef(new Set())

  useEffect(() => {
    api.getProfile().then((d) => {
      setProfile(d)
      d.recentOrders?.forEach((o) => seenOrderIdsRef.current.add(o.orderId))
    })
    setSecure(window.isSecureContext !== false)
    return () => stopCall()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setPhaseBoth = useCallback((p) => { phaseRef.current = p; setPhase(p) }, [])

  function monitor() {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)
    let sumSq = 0
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128
      sumSq += v * v
    }
    const rms = Math.sqrt(sumSq / data.length)
    level.set(Math.min(1, rms * 6))

    const now = performance.now()
    const p = phaseRef.current

    if (p === 'listening') {
      if (rms > START_RMS) beginRecording()
    } else if (p === 'user-speaking') {
      if (rms > CONTINUE_RMS) lastLoudTsRef.current = now
      const recordedFor = now - recordStartTsRef.current
      if (recordedFor > MIN_RECORD_MS && now - lastLoudTsRef.current > SILENCE_MS) {
        finishRecording()
      }
    }

    rafRef.current = requestAnimationFrame(monitor)
  }

  function beginRecording() {
    const stream = streamRef.current
    if (!stream) return
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = handleRecordingStop
    recorder.start()
    recorderRef.current = recorder
    recordStartTsRef.current = performance.now()
    lastLoudTsRef.current = performance.now()
    setPhaseBoth('user-speaking')
  }

  function finishRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  async function handleRecordingStop() {
    setPhaseBoth('transcribing')
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    try {
      const { transcript } = await api.transcribe(blob)
      if (!transcript?.trim()) {
        setPhaseBoth('listening')
        return
      }
      setMessages((m) => [...m, { role: 'user', text: transcript }])
      setPhaseBoth('thinking')
      const res = await api.voiceChat(transcript)

      const newOrder = res.orders?.find((o) => !seenOrderIdsRef.current.has(o.orderId))
      if (newOrder) {
        seenOrderIdsRef.current.add(newOrder.orderId)
        await new Promise((resolve) => {
          setBiometric({ open: true, amount: newOrder.total ?? 0, order: newOrder, resolve })
        })
      }

      setMessages((m) => [...m, { role: 'agent', text: res.reply }])
      setPhaseBoth('ai-speaking')
      await speak(res.reply)
      if (phaseRef.current === 'ai-speaking') setPhaseBoth('listening')
    } catch (e) {
      setMessages((m) => [...m, { role: 'agent', text: `Sorry, I hit an error: ${e.message}` }])
      setPhaseBoth('listening')
    }
  }

  async function startCall() {
    setMicError(null)
    if (!navigator.mediaDevices || !window.isSecureContext) {
      setMicError('Microphone access needs a secure (HTTPS) connection. You’re on: ' + window.location.protocol)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      setPhaseBoth('listening')
      rafRef.current = requestAnimationFrame(monitor)
      if (messages.length === 0) {
        setMessages([{ role: 'agent', text: "Hi Samyak, I'm listening — tell me what you need, and I'll take it from there." }])
      }
    } catch (e) {
      setMicError('Could not access the microphone: ' + e.message)
    }
  }

  function stopCall() {
    cancelAnimationFrame(rafRef.current)
    try { window.speechSynthesis?.cancel() } catch { /* noop */ }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => {})
    streamRef.current = null
    audioCtxRef.current = null
    analyserRef.current = null
    setPhaseBoth('idle')
    level.set(0)
  }

  function confirmBiometric() {
    setBiometric((b) => { b.resolve?.(); return { ...b, open: false } })
  }

  const lastAgentMsg = [...messages].reverse().find((m) => m.role === 'agent')
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-neutral-950 text-white">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Voice Shopping</p>
          <p className="truncate text-xs text-white/50">Hands-free · Ava already knows your orders &amp; preferences</p>
        </div>
        {phase !== 'idle' && (
          <button
            onClick={stopCall}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/90 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-500"
          >
            <PhoneXMarkIcon className="h-4 w-4" /> End
          </button>
        )}
      </div>

      {!secure && (
        <div className="mx-4 mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 sm:mx-6">
          Microphone access needs HTTPS. Open <a href="https://samyak-jain.tech/aura/voice" className="font-semibold underline">https://samyak-jain.tech/aura/voice</a>.
        </div>
      )}
      {micError && <p className="mx-4 mb-2 text-sm text-red-400 sm:mx-6">{micError}</p>}

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6 text-center sm:px-6">
        <button onClick={phase === 'idle' ? startCall : undefined} className="flex flex-col items-center gap-6">
          <VoiceOrb phase={phase} level={level} />
        </button>

        <p className="text-sm font-medium text-white/70">{STATUS_LABEL[phase]}</p>

        <div className="flex w-full max-w-md flex-col gap-2 px-2">
          {lastUserMsg && (
            <p className="w-full break-words rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white/90">
              <span className="mr-1 text-white/40">You</span>{lastUserMsg.text}
            </p>
          )}
          {lastAgentMsg && (
            <p className="flex w-full items-start gap-2 break-words rounded-2xl bg-indigo-500/20 px-4 py-2.5 text-left text-sm text-white">
              <SpeakerWaveIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
              <span>{lastAgentMsg.text}</span>
            </p>
          )}
        </div>

        {phase === 'idle' && (
          <div className="flex flex-col items-center gap-2 text-xs text-white/40">
            <p className="flex items-center gap-1.5"><MicrophoneIcon className="h-3.5 w-3.5" /> Tap the orb once to grant mic access — then it's fully hands-free.</p>
            <p className="max-w-xs">Try: "reorder my usuals", "where's my last order", or "add milk and eggs, then checkout."</p>
          </div>
        )}
      </div>

      {profile && (
        <div className="border-t border-white/10 px-4 py-3 sm:px-6">
          <p className="text-[11px] uppercase tracking-wide text-white/30">Ava already knows</p>
          <p className="mt-1 truncate text-xs text-white/50">
            {profile.profile.dietary} · usual: {profile.profile.usualGroceryList.slice(0, 3).join(', ')}…
          </p>
        </div>
      )}

      <BiometricModal
        open={biometric.open}
        amount={biometric.amount}
        onConfirm={confirmBiometric}
        onCancel={confirmBiometric}
      />
    </div>
  )
}
