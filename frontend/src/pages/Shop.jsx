import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import ProductCard from '../components/ProductCard'

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('rating')

  const category = params.get('category') || 'All'

  useEffect(() => {
    api.listProducts().then((d) => { setProducts(d.products); setCategories(['All', ...d.categories]) })
  }, [])

  const filtered = useMemo(() => {
    let list = products
    if (category !== 'All') list = list.filter((p) => p.category === category)
    if (q.trim()) {
      const t = q.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t))
    }
    list = [...list]
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [products, category, q, sort])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Shop{category !== 'All' ? ` · ${category}` : ''}</h1>
        <div className="flex flex-1 gap-3 sm:max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          >
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setParams(c === 'All' ? {} : { category: c })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === c ? 'border-ink bg-ink text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-neutral-400">{filtered.length} products</p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
