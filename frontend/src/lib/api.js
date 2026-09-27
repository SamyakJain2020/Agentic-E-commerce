function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }
  return 'sid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function sessionId() {
  let id = localStorage.getItem('session_id')
  if (!id) {
    id = makeId()
    localStorage.setItem('session_id', id)
  }
  return id
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId(),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  sessionId,
  listProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id) => request(`/api/products/${id}`),
  getCart: () => request('/api/cart'),
  addToCart: (productId, qty = 1) => request('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, qty }) }),
  removeFromCart: (productId) => request(`/api/cart/items/${productId}`, { method: 'DELETE' }),
  checkout: (discountCode) => request('/api/checkout', { method: 'POST', body: JSON.stringify({ discountCode }) }),
  getOrder: (orderId) => request(`/api/orders/${orderId}`),
  agentChat: (message) => request('/api/agent/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  listGroceries: () => request('/api/groceries'),
  getWallet: () => request('/api/wallet'),
  topupWallet: (amount) => request('/api/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) }),
  biometricCheckout: (discountCode) => request('/api/checkout/biometric', {
    method: 'POST', body: JSON.stringify({ biometricConfirmed: true, discountCode }),
  }),

  createRazorpayOrder: (amountPaise, receipt) => request('/api/create-order', {
    method: 'POST', body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  }),
  verifyRazorpayPayment: (payload) => request('/api/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),

  getProfile: () => request('/api/profile'),
  voiceChat: (message) => request('/api/voice/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  transcribe: async (blob) => {
    const form = new FormData()
    form.append('audio', blob, 'speech.webm')
    const res = await fetch('/api/voice/transcribe', {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId() },
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Request failed (${res.status})`)
    }
    return res.json()
  },
}
