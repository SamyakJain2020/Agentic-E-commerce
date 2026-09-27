import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { PlusIcon, StarIcon } from '@heroicons/react/24/solid'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="group relative">
      <Link to={`/product/${product.id}`} className="block overflow-hidden rounded-2xl bg-neutral-100 shadow-sm transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-neutral-200">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.08]"
        />
        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 backdrop-blur">
            Out of stock
          </span>
        )}
      </Link>
      <motion.button
        onClick={() => addItem(product.id, 1, product.name)}
        disabled={!product.inStock}
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-3 right-3 inline-flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
        aria-label="Quick add to cart"
      >
        <PlusIcon className="h-4 w-4" />
      </motion.button>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <Link to={`/product/${product.id}`} className="text-sm font-medium text-neutral-900 hover:underline">
            {product.name}
          </Link>
          <p className="mt-0.5 text-xs text-neutral-500">{product.color ? `${product.color} · ` : ''}{product.category}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-neutral-900">${product.price.toFixed(2)}</p>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} className={`h-3 w-3 ${i < Math.round(product.rating) ? 'text-amber-400' : 'text-neutral-200'}`} />
        ))}
        <span className="ml-1 text-neutral-400">({product.reviewCount})</span>
      </div>
    </motion.div>
  )
}
