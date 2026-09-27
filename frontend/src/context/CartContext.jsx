import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const data = await api.getCart()
      setCart(data)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast((t) => (t === message ? null : t)), 2400)
  }, [])

  const addItem = useCallback(async (productId, qty = 1, name) => {
    const data = await api.addToCart(productId, qty)
    setCart(data)
    showToast(`Added ${name ? `“${name}”` : 'item'} to cart`)
    return data
  }, [showToast])

  const removeItem = useCallback(async (productId) => {
    const data = await api.removeFromCart(productId)
    setCart(data)
    return data
  }, [])

  const count = cart.items.reduce((n, i) => n + i.qty, 0)

  return (
    <CartContext.Provider value={{ cart, count, loading, refresh, addItem, removeItem, showToast, toast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
