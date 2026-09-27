import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'
import RazorpayButton from '../components/RazorpayButton'

export default function Cart({ onOpenAgent }) {
  const { cart, removeItem, refresh } = useCart()
  const [code, setCode] = useState('')
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleCheckout() {
    setPlacing(true)
    setError(null)
    try {
      const res = await api.checkout(code || undefined)
      setOrder(res.order)
      refresh()
    } catch (e) {
      setError(e.message)
    } finally {
      setPlacing(false)
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl">✅</div>
        <h1 className="mt-6 text-2xl font-bold text-neutral-900">Order placed!</h1>
        <p className="mt-2 text-neutral-500">Order <span className="font-semibold text-neutral-800">{order.orderId}</span> is now processing.</p>
        <p className="mt-1 text-sm text-neutral-500">Total charged: <span className="font-semibold">${order.total.toFixed(2)}</span> · ETA {order.eta}</p>
        {order.paymentMethod === 'razorpay' && (
          <p className="mt-1 text-xs text-emerald-600">Paid via Razorpay · Payment ID {order.razorpayPaymentId}</p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/orders" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">Track this order</Link>
          <Link to="/shop" className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700">Keep shopping</Link>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-lg font-medium text-neutral-800">Your cart is empty</p>
        <p className="mt-2 text-sm text-neutral-500">Ask Ava to find something, or browse the shop.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onOpenAgent} className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white">Ask Ava</button>
          <Link to="/shop" className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700">Browse shop</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-neutral-900">Your cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
              <div>
                <p className="font-medium text-neutral-900">{item.name}</p>
                <p className="text-sm text-neutral-500">Qty {item.qty} · ${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-neutral-900">${(item.price * item.qty).toFixed(2)}</p>
                <button onClick={() => removeItem(item.productId)} className="text-sm text-neutral-400 hover:text-red-500">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900">Summary</h2>
          <div className="mt-4 flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span><span>${cart.total.toFixed(2)}</span>
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-neutral-500">Discount code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. WELCOME10"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          <button
            onClick={handleCheckout}
            disabled={placing}
            className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {placing ? 'Placing order…' : 'Checkout'}
          </button>
          <button
            onClick={onOpenAgent}
            className="mt-3 w-full rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-600 hover:border-indigo-300"
          >
            Let Ava handle checkout
          </button>

          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" /> or pay by card / UPI <div className="h-px flex-1 bg-neutral-200" />
          </div>
          <RazorpayButton
            amountInr={cart.total}
            onSuccess={(o) => { setOrder(o); refresh() }}
          />
          <p className="mt-2 text-center text-[11px] text-neutral-400">Test mode · cart total billed as ₹{cart.total.toFixed(2)} via Razorpay</p>
        </div>
      </div>
    </div>
  )
}
