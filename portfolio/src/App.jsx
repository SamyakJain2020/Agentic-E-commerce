import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { UserIcon, DocumentTextIcon, RectangleGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Sidebar from './components/Sidebar'
import About from './sections/About'
import Resume from './sections/Resume'
import Portfolio from './sections/Portfolio'
import Contact from './sections/Contact'

const TABS = [
  { id: 'about', label: 'About', Icon: UserIcon, Component: About },
  { id: 'resume', label: 'Resume', Icon: DocumentTextIcon, Component: Resume },
  { id: 'portfolio', label: 'Projects', Icon: RectangleGroupIcon, Component: Portfolio },
  { id: 'contact', label: 'Contact', Icon: ChatBubbleLeftRightIcon, Component: Contact },
]

export default function App() {
  const [active, setActive] = useState('about')
  const ActiveComponent = TABS.find((t) => t.id === active).Component

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <Sidebar />

        <main className="min-w-0 flex-1 rounded-3xl bg-panel/40 p-6 sm:p-8 lg:p-10">
          <nav className="flex flex-wrap gap-2 rounded-full bg-panel p-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active === t.id ? 'text-ink' : 'text-muted hover:text-white'
                }`}
              >
                {active === t.id && (
                  <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} />
                )}
                <span className="relative flex items-center gap-1.5">
                  <t.Icon className="h-4 w-4" /> {t.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
