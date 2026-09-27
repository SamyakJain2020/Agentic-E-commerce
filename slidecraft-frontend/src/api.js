function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }
  return 'sid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function sessionId() {
  let id = localStorage.getItem('slidecraft_session_id')
  if (!id) {
    id = makeId()
    localStorage.setItem('slidecraft_session_id', id)
  }
  return id
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId(), ...(options.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  sessionId,
  authStatus: () => request('/api/slidecraft/auth/status'),
  generate: (payload) => request('/api/slidecraft/generate', { method: 'POST', body: JSON.stringify(payload) }),
  getDeck: () => request('/api/slidecraft/deck'),
  chat: (message) => request('/api/slidecraft/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  syncCanva: () => request('/api/slidecraft/canva/sync', { method: 'POST' }),
  listUploads: () => request('/api/slidecraft/uploads'),
  uploadFiles: async (files) => {
    const form = new FormData()
    for (const f of files) form.append('files', f)
    const res = await fetch('/api/slidecraft/upload', { method: 'POST', headers: { 'X-Session-Id': sessionId() }, body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Request failed (${res.status})`)
    }
    return res.json()
  },
}
