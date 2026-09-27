import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { ChatBubbleLeftRightIcon, TruckIcon, TagIcon, MicrophoneIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { api } from '../lib/api'
import ProductCard from '../components/ProductCard'
import Reveal, { Stagger, StaggerItem } from '../components/Reveal'

const HERO_IMG = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop'

const USE_CASES = [
  {
    title: 'Autonomous conversational shopping',
    body: 'State a goal — “find a red striped shirt under $30” — and Ava searches the catalog, checks ratings, applies the best discount, and can complete the purchase in one thread.',
    Icon: ChatBubbleLeftRightIcon,
  },
  {
    title: 'Proactive WISMO support',
    body: 'Ava resolves “where is my order” instantly by reading live tracking data, and can trigger a return or refund without a support ticket.',
    Icon: TruckIcon,
  },
  {
    title: 'Always-on negotiation',
    body: 'Ava applies eligible discount codes automatically and tells you exactly what you saved before you confirm checkout.',
    Icon: TagIcon,
  },
]

const CATEGORY_TILES = [
  { label: 'Shirts', to: '/shop?category=Shirts', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=70&auto=format&fit=crop' },
  { label: 'Outerwear', to: '/shop?category=Outerwear', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=70&auto=format&fit=crop' },
  { label: 'Footwear', to: '/shop?category=Footwear', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=70&auto=format&fit=crop' },
  { label: 'Groceries', to: '/groceries', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=70&auto=format&fit=crop' },
]

export default function Home({ onOpenAgent }) {
  const [featured, setFeatured] = useState([])
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    api.listProducts().then((d) => setFeatured(d.products.slice(0, 8)))
  }, [])

  return (
    <div>
      <section ref={heroRef} className="relative h-[92vh] min-h-[600px] overflow-hidden bg-neutral-950">
        <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
          <img src={HERO_IMG} alt="" className="h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/20" />
          <div className="absolute inset-0 bg-grain" />
        </motion.div>

        <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
          <motion.span
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Agentic commerce, live
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] text-white text-balance sm:text-6xl lg:text-7xl"
          >
            Don't shop.
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">Just say what you want.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.22 }}
            className="mt-6 max-w-lg text-lg text-neutral-300"
          >
            Ava is an autonomous shopping agent built into Aura — she researches, compares, applies
            discounts, tracks orders, and checks out, right inside the chat, by text or by voice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.34 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <button
              onClick={onOpenAgent}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg transition hover:scale-[1.03]"
            >
              Chat with Ava →
            </button>
            <Link
              to="/voice"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <MicrophoneIcon className="h-4 w-4" /> Try voice shopping
            </Link>
          </motion.div>
        </motion.div>

        <div className="absolute inset-x-0 bottom-8 mx-auto hidden max-w-7xl px-4 sm:px-6 md:block lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="ml-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl"
          >
            <p className="text-xs font-medium text-neutral-300">You</p>
            <p className="mt-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white">Find a red striped shirt under $30</p>
            <p className="mt-3 text-xs font-medium text-indigo-200">Ava</p>
            <p className="mt-1 rounded-xl bg-indigo-500/25 px-3 py-2 text-sm text-white">
              Found it — $24.50, 4.8★. Want me to apply AGENT15 and check out?
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Shop by category</h2>
        </Reveal>
        <Stagger className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORY_TILES.map((c) => (
            <StaggerItem key={c.label}>
              <Link to={c.to} className="group relative block h-56 overflow-hidden rounded-2xl">
                <img src={c.img} alt={c.label} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute bottom-4 left-4 font-display text-xl font-semibold text-white">{c.label}</span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Agentic e-commerce</h2>
          <p className="mt-2 max-w-2xl font-display text-2xl font-semibold text-neutral-900 sm:text-3xl">
            One agent. Research, negotiation, and fulfilment — end to end.
          </p>
        </Reveal>
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-3">
          {USE_CASES.map(({ title, body, Icon }) => (
            <StaggerItem key={title}>
              <div className="h-full rounded-2xl border border-neutral-200 p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 text-indigo-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="relative overflow-hidden bg-ink py-20">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <ShoppingCartIcon className="mx-auto h-10 w-10 text-white/50" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">Groceries in one step</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Pick your basket, confirm with biometrics, and pay straight from your reserve wallet — no separate checkout page.
          </p>
          <Link to="/groceries" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg transition hover:scale-[1.03]">
            Shop groceries →
          </Link>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-neutral-900">Featured this week</h2>
          <Link to="/shop" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View all →</Link>
        </Reveal>
        <Stagger className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <StaggerItem key={p.id}><ProductCard product={p} /></StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
