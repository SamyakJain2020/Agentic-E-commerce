import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react'
import { ShoppingBagIcon, SparklesIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCart } from '../context/CartContext'

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/groceries', label: 'Groceries' },
  { to: '/voice', label: 'Voice Shopping' },
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
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled ? 'border-neutral-200/70 bg-white/85 backdrop-blur-lg shadow-[0_1px_0_0_rgba(0,0,0,0.03)]' : 'border-transparent bg-white/60 backdrop-blur-sm'
      }`}
    >
      <nav className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${scrolled ? 'h-14' : 'h-20'}`}>
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-600 font-sans text-sm font-bold text-white">A</span>
          Aura
        </Link>

        <div className="hidden gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `relative py-1 text-sm font-medium transition-colors hover:text-ink ${isActive ? 'text-ink' : 'text-neutral-500'}`
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

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAgent}
            className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-200 sm:inline-flex"
          >
            <SparklesIcon className="h-4 w-4" />
            Ask Ava
          </button>
          <Link
            to="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 md:hidden"
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
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
