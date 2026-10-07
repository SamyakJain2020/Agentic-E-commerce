import { motion } from 'motion/react'
import { profile, services } from '../data'

export default function About() {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-semibold text-white">About me</h2>
      <p className="mt-5 max-w-2xl text-balance leading-relaxed text-muted">{profile.tagline}</p>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted">
        I'm an MBA candidate at NMIMS Mumbai with hands-on experience shipping AI systems inside regulated
        financial institutions — from a compliance data platform processing 10M+ records a day at UBS, to an
        agentic trade-finance workflow at Axis Bank projected to save ₹1.2 Cr. Outside of coursework, I build
        full-stack AI products end to end, like the agentic storefront linked in my projects.
      </p>

      <h3 className="mt-10 font-display text-xl font-semibold text-white">What I do</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl bg-panel p-5 transition hover:bg-panel2"
          >
            <h4 className="font-semibold text-white">{s.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
