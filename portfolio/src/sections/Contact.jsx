import { EnvelopeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
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

const CHANNELS = [
  { label: 'Email', value: 'samyak.jain016@nmims.in', href: `mailto:${profile.email}`, Icon: EnvelopeIcon },
  { label: 'LinkedIn', value: '2samyakj', href: profile.linkedin, Icon: LinkedinIcon },
  { label: 'GitHub', value: 'SamyakJain2020', href: profile.github, Icon: GithubIcon },
]

export default function Contact() {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-semibold text-white">Get in touch</h2>
      <p className="mt-3 max-w-xl text-muted">
        Open to conversations on AI in financial services, agentic product design, or MBA-summer / full-time roles. Reach out on whichever channel works for you.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ label, value, href, Icon }) => (
          <a
            key={label}
            href={href}
            target={label === 'Email' ? undefined : '_blank'}
            rel={label === 'Email' ? undefined : 'noreferrer'}
            className="group flex flex-col items-start gap-3 rounded-2xl bg-panel p-5 transition hover:bg-panel2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel2 text-accent group-hover:bg-accent group-hover:text-ink">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-0.5 truncate text-sm font-medium text-white">{value}</p>
            </div>
          </a>
        ))}
      </div>

      <a
        href={profile.resume}
        download
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
      >
        <ArrowDownTrayIcon className="h-4 w-4" /> Download full resume
      </a>
    </div>
  )
}
