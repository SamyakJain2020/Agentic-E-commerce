import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useCart } from '../context/CartContext'
import BiometricModal from '../components/BiometricModal'
import WalletCard from '../components/WalletCard'

function QtyStepper({ qty, onChange }) {
  return (
    <div className="flex items-center rounded-full border border-neutral-200 bg-white">
      <button
        onClick={() => onChange(Math.max(0, qty - 1))}
        className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900"
      >−</button>
      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
      <button
        onClick={() => onChange(qty + 1)}
        className="flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900"
      >+</button>
    </div>
  )
}

function GroceryCard({ product, qty, onChange }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
      <img src={product.image} alt={product.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-400">{product.unit}</p>
        <p className="mt-0.5 text-sm font-semibold text-neutral-900">${product.price.toFixed(2)}</p>
      </div>
      {qty > 0 ? (
        <QtyStepper qty={qty} onChange={onChange} />
      ) : (
        <button
          onClick={() => onChange(1)}
          className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
        >
          Add
        </button>
      )}
    </div>
  )
}

export default function Groceries() {
  const { cart, refresh } = useCart()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [biometricOpen, setBiometricOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [walletKey, setWalletKey] = useState(0)

  useEffect(() => {
    api.listGroceries().then((d) => { setProducts(d.products); setCategories(d.categories) })
  }, [])

  const qtyById = useMemo(() => {
    const m = {}
    for (const item of cart.items) m[item.productId] = item.qty
    return m
  }, [cart])

  async function setQty(product, qty) {
    const current = qtyById[product.id] || 0
    if (qty === current) return
    if (qty === 0) {
      await api.removeFromCart(product.id)
    } else if (qty > current) {
      await api.addToCart(product.id, qty - current)
    } else {
      await api.removeFromCart(product.id)
      if (qty > 0) await api.addToCart(product.id, qty)
    }
    refresh()
  }

  const groceryTotal = products
    .filter((p) => qtyById[p.id])
    .reduce((sum, p) => sum + p.price * qtyById[p.id], 0)
  const groceryCount = products.reduce((n, p) => n + (qtyById[p.id] || 0), 0)

  async function confirmBiometric() {
    setPlacing(true)
    setError(null)
    try {
      const res = await api.biometricCheckout()
      setOrder(res.order)
      setWalletKey((k) => k + 1)
      refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setPlacing(false)
      setBiometricOpen(false)
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl">✅</div>
        <h1 className="mt-6 text-2xl font-bold text-neutral-900">Order confirmed with 1-Step™</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {order.orderId} · ${order.total.toFixed(2)} paid via biometric wallet checkout
        </p>
        <p className="mt-1 text-sm text-neutral-500">Delivery ETA: {order.eta}</p>
        <button
          onClick={() => setOrder(null)}
          className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
        >
          Continue shopping
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-32 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          🛒 Amazon Pay style groceries
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">Groceries, delivered fast</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Pick your items, then pay in one step with biometric confirmation — funds are pulled straight from your reserve wallet.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-lg font-bold text-neutral-900">{cat}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {products.filter((p) => p.category === cat).map((p) => (
                  <GroceryCard key={p.id} product={p} qty={qtyById[p.id] || 0} onChange={(q) => setQty(p, q)} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <WalletCard refreshKey={walletKey} />
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h3 className="font-semibold text-neutral-900">Your grocery basket</h3>
            <p className="mt-1 text-sm text-neutral-500">{groceryCount} items · ${groceryTotal.toFixed(2)}</p>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <button
              onClick={() => setBiometricOpen(true)}
              disabled={groceryCount === 0 || placing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.972" />
              </svg>
              Pay with 1-Step™
            </button>
            <p className="mt-2 text-center text-[11px] text-neutral-400">Biometric confirmation · no separate checkout page</p>
          </div>
        </div>
      </div>

      {groceryCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur sm:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">{groceryCount} items</p>
              <p className="font-bold text-neutral-900">${groceryTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setBiometricOpen(true)}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white"
            >
              Pay with 1-Step™
            </button>
          </div>
        </div>
      )}

      <BiometricModal
        open={biometricOpen}
        amount={groceryTotal}
        onConfirm={confirmBiometric}
        onCancel={() => setBiometricOpen(false)}
      />
    </div>
  )
}
