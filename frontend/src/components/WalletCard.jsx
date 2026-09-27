import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function WalletCard({ refreshKey }) {
  const [wallet, setWallet] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const w = await api.getWallet()
    setWallet(w)
  }

  useEffect(() => { load() }, [refreshKey])

  async function topup(amount) {
    setBusy(true)
    try {
      const w = await api.topupWallet(amount)
      setWallet(w)
    } finally {
      setBusy(false)
    }
  }

  if (!wallet) return null

  return (
    <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-700 p-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">Reserve Wallet</p>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 8.25v9a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-9M2.25 8.25l1.5-3.75A2.25 2.25 0 016 3h12a2.25 2.25 0 012.25 1.5l1.5 3.75" />
        </svg>
      </div>
      <p className="mt-3 text-3xl font-extrabold">${wallet.available.toFixed(2)}</p>
      <p className="text-xs text-white/60">available to spend</p>
      {wallet.reserved > 0 && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-medium text-amber-300">
          ${wallet.reserved.toFixed(2)} reserved
        </p>
      )}
      <div className="mt-4 flex gap-2">
        {[50, 100].map((amt) => (
          <button
            key={amt}
            onClick={() => topup(amt)}
            disabled={busy}
            className="flex-1 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            + Add ${amt}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-white/40">Balance: ${wallet.balance.toFixed(2)} · demo funds, not real money</p>
    </div>
  )
}
