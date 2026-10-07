import { EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { profile } from '../data'

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.42.36.78 1.08.78 2.18 0 1.57-.01 2.84-.01 3.23 0 .3.21.66.8.55A10.52 10.52 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
    </svg>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-full shrink-0 rounded-3xl bg-panel p-6 lg:sticky lg:top-6 lg:w-80 lg:self-start">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/90 to-emerald-400 font-display text-4xl font-semibold text-ink">
          SJ
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-white">{profile.name}</h1>
        <p className="mt-1 rounded-full bg-panel2 px-3 py-1 text-xs font-medium text-accent">{profile.title}</p>
      </div>

      <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel2 text-accent"><EnvelopeIcon className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted">Email</p>
            <a href={`mailto:${profile.email}`} className="block truncate text-sm text-white hover:text-accent">{profile.email}</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel2 text-accent"><MapPinIcon className="h-4 w-4" /></span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">Location</p>
            <p className="text-sm text-white">{profile.location}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 border-t border-white/10 pt-6">
        <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-panel2 text-white transition hover:bg-accent hover:text-ink" aria-label="LinkedIn">
          <LinkedinIcon className="h-4 w-4" />
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-panel2 text-white transition hover:bg-accent hover:text-ink" aria-label="GitHub">
          <GithubIcon className="h-4 w-4" />
        </a>
      </div>
    </aside>
  )
}
