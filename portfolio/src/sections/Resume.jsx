import { motion } from 'motion/react'
import { ArrowDownTrayIcon, AcademicCapIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { profile, experience, education, certifications, skillGroups } from '../data'

function Timeline({ items, renderTitle, renderMeta }) {
  return (
    <div className="relative mt-6 space-y-8 border-l border-white/10 pl-6">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="relative"
        >
          <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
          <p className="text-xs font-medium uppercase tracking-wide text-accent">{renderMeta(item)}</p>
          {renderTitle(item)}
        </motion.div>
      ))}
    </div>
  )
}

export default function Resume() {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold text-white">Resume</h2>
        <a
          href={profile.resume}
          download
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
        >
          <ArrowDownTrayIcon className="h-4 w-4" /> Download PDF
        </a>
      </div>

      <div className="mt-10 flex items-center gap-2">
        <BriefcaseIcon className="h-5 w-5 text-accent" />
        <h3 className="font-display text-xl font-semibold text-white">Experience</h3>
      </div>
      <Timeline
        items={experience}
        renderMeta={(e) => e.period}
        renderTitle={(e) => (
          <div className="mt-1">
            <p className="font-semibold text-white">{e.role} · <span className="text-muted">{e.org}</span></p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted">
              {e.points.map((p, j) => <li key={j}>{p}</li>)}
            </ul>
          </div>
        )}
      />

      <div className="mt-12 flex items-center gap-2">
        <AcademicCapIcon className="h-5 w-5 text-accent" />
        <h3 className="font-display text-xl font-semibold text-white">Education</h3>
      </div>
      <Timeline
        items={education}
        renderMeta={(e) => e.period}
        renderTitle={(e) => (
          <div className="mt-1">
            <p className="font-semibold text-white">{e.degree}</p>
            <p className="text-sm text-muted">{e.school} · {e.meta}</p>
          </div>
        )}
      />

      <div className="mt-12">
        <h3 className="font-display text-xl font-semibold text-white">Skills</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {skillGroups.map((g) => (
            <div key={g.title}>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">{g.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.skills.map((s) => (
                  <span key={s} className="rounded-full bg-panel2 px-3 py-1 text-xs text-white/80">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h3 className="font-display text-xl font-semibold text-white">Certifications & publications</h3>
        <ul className="mt-4 space-y-2.5">
          {certifications.map((c) => (
            <li key={c.name} className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2.5 text-sm">
              <span className="text-white/85">{c.name}</span>
              <span className="shrink-0 text-muted">{c.year}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
