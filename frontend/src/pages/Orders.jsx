import { useState } from 'react'
import { api } from '../lib/api'

const STAGES = ['Processing', 'Packed', 'Shipped', 'Out for delivery', 'Delivered']

function StatusBar({ status }) {
  const idx = STAGES.indexOf(status)
  return (
    <div className="mt-6">
      <div className="flex items-center">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? 'bg-indigo-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            {i < STAGES.length - 1 && <div className={`h-1 flex-1 ${i < idx ? 'bg-indigo-600' : 'bg-neutral-200'}`} />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
        {STAGES.map((s) => <span key={s} className="w-16 text-center first:text-left last:text-right">{s}</span>)}
      </div>
    </div>
  )
}

export default function Orders() {
  const [orderId, setOrderId] = useState('ORD-10021')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function lookup(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const res = await api.getOrder(orderId.trim())
      setOrder(res)
    } catch (e) {
      setError("We couldn't find that order. Try ORD-10021 or ORD-10008, or ask Ava.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-neutral-900">Where is my order?</h1>
      <p className="mt-2 text-sm text-neutral-500">Enter an order id, or ask Ava in chat — she reads the same live tracking data.</p>

      <form onSubmit={lookup} className="mt-6 flex gap-3">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="ORD-10021"
          className="flex-1 rounded-full border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <button className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white">{loading ? 'Searching…' : 'Track'}</button>
      </form>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {order && (
        <div className="mt-8 rounded-2xl border border-neutral-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Order</p>
              <p className="text-lg font-bold text-neutral-900">{order.orderId}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{order.status}</span>
          </div>
          <StatusBar status={order.status} />
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div><p className="text-neutral-400">Carrier</p><p className="font-medium text-neutral-800">{order.carrier}</p></div>
            <div><p className="text-neutral-400">Tracking ID</p><p className="font-medium text-neutral-800">{order.trackingId}</p></div>
            <div><p className="text-neutral-400">ETA</p><p className="font-medium text-neutral-800">{order.eta}</p></div>
          </div>
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <p className="text-sm font-medium text-neutral-700">Items</p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-500">
              {order.items.map((it) => (
                <li key={it.productId} className="flex justify-between">
                  <span>{it.name} × {it.qty}</span>
                  <span>${(it.price * it.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
