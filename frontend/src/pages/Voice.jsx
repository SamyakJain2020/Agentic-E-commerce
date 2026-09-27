import { useEffect, useRef, useState } from 'react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'
import Reveal from '../components/Reveal'
import { api } from '../lib/api'

function speak(text) {
  try {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.02
    window.speechSynthesis.speak(u)
  } catch {
    // ignore — TTS is a nice-to-have
  }
}

export default function Voice() {
  const [profile, setProfile] = useState(null)
  const [messages, setMessages] = useState([
    { role: 'agent', text: "Hi Samyak, I'm Ava. I already know your usual list and past orders — just tap the mic and tell me what you need." },
  ])
  const [status, setStatus] = useState('idle') // idle | recording | transcribing | thinking
  const [micError, setMicError] = useState(null)
  const [secure, setSecure] = useState(true)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const scrollRef = useRef(null)

  useEffect(() => {
    api.getProfile().then((d) => setProfile(d))
    setSecure(window.isSecureContext !== false)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  async function startRecording() {
    setMicError(null)
    if (!navigator.mediaDevices || !window.isSecureContext) {
      setMicError('Microphone access needs a secure (HTTPS) connection. You’re on: ' + window.location.protocol)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunks.current = []
      mr.ondataavailable = (e) => chunks.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        handleRecordingStop()
      }
      mr.start()
      mediaRecorder.current = mr
      setStatus('recording')
    } catch (e) {
      setMicError('Could not access the microphone: ' + e.message)
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
  }

  async function handleRecordingStop() {
    setStatus('transcribing')
    const blob = new Blob(chunks.current, { type: 'audio/webm' })
    try {
      const { transcript } = await api.transcribe(blob)
      if (!transcript?.trim()) {
        setStatus('idle')
        return
      }
      setMessages((m) => [...m, { role: 'user', text: transcript }])
      setStatus('thinking')
      const res = await api.voiceChat(transcript)
      setMessages((m) => [...m, { role: 'agent', text: res.reply, cards: res.cards, orders: res.orders }])
      speak(res.reply)
    } catch (e) {
      setMessages((m) => [...m, { role: 'agent', text: `Sorry, I hit an error: ${e.message}` }])
    } finally {
      setStatus('idle')
    }
  }

  function toggleMic() {
    if (status === 'recording') stopRecording()
    else if (status === 'idle') startRecording()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-purple-700 p-8 text-white">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">🎙️ Real-time voice shopping</span>
        <h1 className="mt-3 text-3xl font-extrabold">Talk to Ava</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          A separate, voice-first flow. Ava already has your past orders and preferences loaded — she can walk the whole thing end to end, hands-free.
        </p>
      </div>

      {!secure && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You're on an insecure connection — browsers block microphone access outside HTTPS. Open this page via{' '}
          <a href="https://samyak-jain.tech/voice" className="font-semibold underline">https://samyak-jain.tech/voice</a> to use the mic.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={scrollRef} className="h-[480px] overflow-y-auto rounded-2xl border border-neutral-200 p-5">
            {messages.map((m, i) => (
              <div key={i} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {(status === 'transcribing' || status === 'thinking') && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm text-neutral-400">
                  {status === 'transcribing' ? 'Transcribing…' : 'Ava is thinking…'}
                </div>
              </div>
            )}
          </div>

          {micError && <p className="mt-3 text-sm text-red-500">{micError}</p>}

          <div className="mt-6 flex flex-col items-center">
            <div className="relative">
              {status === 'recording' && <span className="absolute inset-0 animate-ping rounded-full bg-red-400/50" />}
              <button
                onClick={toggleMic}
                disabled={status === 'transcribing' || status === 'thinking'}
                className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition disabled:opacity-50 ${
                  status === 'recording' ? 'scale-110 bg-red-500' : 'bg-gradient-to-br from-indigo-600 to-fuchsia-600 hover:scale-105'
                }`}
              >
                {status === 'recording' ? <StopIcon className="h-7 w-7" /> : <MicrophoneIcon className="h-8 w-8" />}
              </button>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              {status === 'recording' ? 'Listening… tap to stop' : status === 'idle' ? 'Tap to speak' : 'One moment…'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-900">What Ava already knows</h3>
            {profile ? (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-neutral-400">Dietary notes</p>
                  <p className="text-neutral-700">{profile.profile.dietary}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-400">Usual list</p>
                  <p className="text-neutral-700">{profile.profile.usualGroceryList.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-400">Recent orders</p>
                  <ul className="mt-1 space-y-1">
                    {profile.recentOrders.map((o) => (
                      <li key={o.orderId} className="flex justify-between text-neutral-700">
                        <span>{o.orderId}</span><span className="text-neutral-400">{o.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-400">Loading…</p>
            )}
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs leading-relaxed text-indigo-900">
            Try saying: <span className="font-semibold">"Reorder my usuals"</span>,{' '}
            <span className="font-semibold">"Where's my last order?"</span>, or{' '}
            <span className="font-semibold">"Add milk and eggs, then checkout."</span>
          </div>
        </div>
      </div>
    </div>
  )
}
