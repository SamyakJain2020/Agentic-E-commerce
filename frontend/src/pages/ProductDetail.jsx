import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    setProduct(null)
    api.getProduct(id).then(setProduct)
  }, [id])

  if (!product) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-neutral-400">Loading…</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-neutral-400">
        <Link to="/shop" className="hover:text-neutral-700">Shop</Link> / <span className="text-neutral-600">{product.category}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-neutral-100">
          <img src={product.image} alt={product.name} className="aspect-[3/4] w-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-amber-500">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
            <span className="text-neutral-400">{product.rating} · {product.reviewCount} reviews</span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-neutral-900">${product.price.toFixed(2)}</p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-3 py-1">{product.category}</span>
            <span className="rounded-full bg-neutral-100 px-3 py-1">{product.color}</span>
            <span className={`rounded-full px-3 py-1 ${product.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {product.inStock ? 'In stock' : 'Out of stock'}
            </span>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-neutral-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-neutral-500">−</button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-neutral-500">+</button>
            </div>
            <button
              onClick={() => addItem(product.id, qty, product.name)}
              disabled={!product.inStock}
              className="flex-1 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            >
              Add to cart
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
            💡 Tip: ask <span className="font-semibold">Ava</span> — "compare this with something cheaper" or "add this and apply a discount".
          </div>
        </div>
      </div>
    </div>
  )
}
