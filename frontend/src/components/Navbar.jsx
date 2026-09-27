import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react'
import { ShoppingBagIcon, SparklesIcon, Bars3Icon, XMarkIcon, MicrophoneIcon } from '@heroicons/react/24/outline'
import { useCart } from '../context/CartContext'

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/groceries', label: 'Groceries' },
  { to: '/voice', label: 'Voice Shopping', Icon: MicrophoneIcon },
  { to: '/orders', label: 'Track Order' },
]

export default function Navbar({ onOpenAgent }) {
  const { count } = useCart()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12))

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors duration-300 ${
        scrolled ? 'border-neutral-200/70 bg-white/85 backdrop-blur-lg shadow-[0_1px_0_0_rgba(0,0,0,0.03)]' : 'border-transparent bg-white/70 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 font-display text-lg font-semibold tracking-tight sm:text-xl">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 font-sans text-sm font-bold text-white">A</span>
          <span>Aura</span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `relative whitespace-nowrap py-1 text-sm font-medium transition-colors hover:text-ink ${isActive ? 'text-ink' : 'text-neutral-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-ink" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenAgent}
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-200 md:inline-flex"
          >
            <SparklesIcon className="h-4 w-4 shrink-0" />
            Ask Ava
          </button>
          <Link
            to="/cart"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 sm:h-10 sm:w-10"
            aria-label="Cart"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-bold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 sm:h-10 sm:w-10 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-200 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 px-3 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-neutral-100 text-ink' : 'text-neutral-600 hover:bg-neutral-50'}`
                  }
                >
                  {l.Icon && <l.Icon className="h-4 w-4 shrink-0" />}
                  {l.label}
                </NavLink>
              ))}
              <button
                onClick={() => { setMobileOpen(false); onOpenAgent() }}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <SparklesIcon className="h-4 w-4" /> Ask Ava
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
