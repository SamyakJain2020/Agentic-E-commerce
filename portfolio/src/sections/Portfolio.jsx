import { motion } from 'motion/react'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'
import { projects } from '../data'

export default function Portfolio() {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-semibold text-white">Projects</h2>
      <p className="mt-3 max-w-xl text-muted">A mix of shipped products and case studies from my finance and AI work.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {projects.map((p, i) => (
          <motion.a
            key={p.title}
            href={p.href}
            target={p.external ? '_blank' : undefined}
            rel={p.external ? 'noreferrer' : undefined}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group flex flex-col rounded-2xl bg-panel p-6 transition hover:bg-panel2"
          >
            <span className="w-fit rounded-full bg-panel2 px-2.5 py-1 text-[11px] font-medium text-accent">{p.tag}</span>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">{p.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.body}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:text-accent">
              {p.cta} <ArrowUpRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
