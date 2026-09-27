import { useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AgentChat from './components/AgentChat'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Groceries from './pages/Groceries'
import Voice from './pages/Voice'

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const [agentOpen, setAgentOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onOpenAgent={() => setAgentOpen(true)} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home onOpenAgent={() => setAgentOpen(true)} /></PageTransition>} />
            <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
            <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Cart onOpenAgent={() => setAgentOpen(true)} /></PageTransition>} />
            <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
            <Route path="/groceries" element={<PageTransition><Groceries /></PageTransition>} />
            <Route path="/voice" element={<PageTransition><Voice /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />

      <button
        onClick={() => setAgentOpen(true)}
        className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-xl transition hover:scale-105 sm:hidden ${agentOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open Ava"
      >
        <span className="text-sm font-bold">Ava</span>
      </button>

      <AgentChat open={agentOpen} onClose={() => setAgentOpen(false)} />
    </div>
  )
}
