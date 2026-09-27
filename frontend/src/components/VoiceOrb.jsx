import { motion, useTransform } from 'motion/react'

const PHASE_STYLE = {
  idle: { from: '#6366f1', to: '#a855f7', label: 'Tap to start' },
  listening: { from: '#6366f1', to: '#22d3ee', label: 'Listening…' },
  'user-speaking': { from: '#22d3ee', to: '#6366f1', label: 'Listening…' },
  transcribing: { from: '#f59e0b', to: '#f97316', label: 'Got it…' },
  thinking: { from: '#a855f7', to: '#ec4899', label: 'Thinking…' },
  'ai-speaking': { from: '#10b981', to: '#22d3ee', label: 'Speaking…' },
}

export default function VoiceOrb({ phase, level }) {
  const style = PHASE_STYLE[phase] || PHASE_STYLE.idle
  const scale = useTransform(level, [0, 1], [1, 1.35])
  const ringScale = useTransform(level, [0, 1], [1.05, 1.6])
  const isActive = phase !== 'idle'

  return (
    <div className="relative flex h-56 w-56 shrink-0 items-center justify-center sm:h-64 sm:w-64">
      {isActive && (
        <motion.span
          style={{ scale: ringScale, background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        />
      )}
      <motion.span
        animate={phase === 'thinking' ? { rotate: 360 } : { rotate: 0 }}
        transition={phase === 'thinking' ? { repeat: Infinity, duration: 2.2, ease: 'linear' } : {}}
        className="absolute inset-6 rounded-full opacity-70 blur-md"
        style={{ background: `conic-gradient(from 0deg, ${style.from}, ${style.to}, ${style.from})` }}
      />
      <motion.div
        style={{ scale }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative flex h-36 w-36 items-center justify-center rounded-full shadow-2xl sm:h-40 sm:w-40"
        aria-hidden
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle at 35% 30%, ${style.to}, ${style.from})` }}
        />
        <span className="absolute inset-[3px] rounded-full bg-neutral-950/90 backdrop-blur" />
        <span className="relative h-3 w-3 rounded-full bg-white/90 shadow-[0_0_20px_6px_rgba(255,255,255,0.35)]" />
      </motion.div>
    </div>
  )
}
